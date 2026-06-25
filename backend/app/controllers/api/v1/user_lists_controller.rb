module Api
  module V1
    # UserListsController — CRUD + reorder + like/unlike for user-curated book lists.
    #
    # Public endpoints (no auth required):
    #   GET /api/v1/users/:user_id/lists           — index (public lists for a user)
    #   GET /api/v1/users/:user_id/lists/:id       — show (one public list + items)
    #
    # Authenticated endpoints (own list only for mutations):
    #   GET    /api/v1/users/:user_id/lists/top_10 — find or create the Top 10 list
    #   POST   /api/v1/users/:user_id/lists        — create a new list
    #   PATCH  /api/v1/users/:user_id/lists/:id    — update metadata
    #   DELETE /api/v1/users/:user_id/lists/:id    — destroy
    #
    # Items:
    #   POST   /api/v1/users/:user_id/lists/:id/items         — add a book
    #   DELETE /api/v1/users/:user_id/lists/:id/items/:item_id — remove a book
    #   PATCH  /api/v1/users/:user_id/lists/:id/reorder        — bulk reorder
    #
    # Reactions:
    #   POST   /api/v1/users/:user_id/lists/:id/like   — like
    #   DELETE /api/v1/users/:user_id/lists/:id/unlike — unlike
    class UserListsController < BaseController
      include Authenticable

      before_action :authenticate_user!, except: [:index, :show]
      before_action :set_profile_user
      before_action :set_list, only: [:show, :update, :destroy, :add_item, :remove_item, :reorder, :like, :unlike]
      before_action :require_ownership!, only: [:update, :destroy, :add_item, :remove_item, :reorder]

      # GET /api/v1/users/:user_id/lists
      # Returns all lists for the owner, public-only for everyone else.
      def index
        lists = if current_user&.id == @profile_user.id
          @profile_user.user_lists.includes(user_list_items: :book)
        else
          @profile_user.user_lists.public_lists.includes(user_list_items: :book)
        end
        render json: { lists: lists.map { |l| serialize_list(l, include_items: true) } }, status: :ok
      end

      # GET /api/v1/users/:user_id/lists/:id
      def show
        return render_forbidden unless viewable?(@list)
        render json: { list: serialize_list(@list, include_items: true) }, status: :ok
      end

      # GET /api/v1/users/:user_id/lists/top_10
      # Finds or creates the user's Top 10 list (owner only).
      def top_10
        return render_forbidden unless current_user.id == @profile_user.id
        list = UserList.find_or_create_top_10_for(@profile_user)
        render json: { list: serialize_list(list, include_items: true) }, status: :ok
      end

      # POST /api/v1/users/:user_id/lists
      def create
        return render_forbidden unless current_user.id == @profile_user.id

        list = @profile_user.user_lists.build(list_params)
        if list.save
          render json: { list: serialize_list(list, include_items: true) }, status: :created
        else
          render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/users/:user_id/lists/:id
      def update
        if @list.update(list_params)
          render json: { list: serialize_list(@list, include_items: true) }, status: :ok
        else
          render json: { errors: @list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/users/:user_id/lists/:id
      def destroy
        @list.destroy
        render json: { message: 'List deleted' }, status: :ok
      end

      # POST /api/v1/users/:user_id/lists/:id/items
      # Body: { book_id: 123, position: 1 }
      # If position is occupied, shifts existing items down.
      def add_item
        book_id  = params[:book_id].to_i
        position = params[:position].to_i

        return render json: { error: 'book_id is required' }, status: :unprocessable_entity if book_id.zero?

        # Validate Top 10 cap before any DB work
        if @list.top_10? && @list.user_list_items.count >= 10
          return render json: { error: 'Top 10 list is full (10 books maximum)' }, status: :unprocessable_entity
        end

        # Auto-assign next available position if none given or position is 0
        if position.zero?
          taken = @list.user_list_items.pluck(:position)
          position = (1..10).find { |p| taken.exclude?(p) } || (@list.user_list_items.maximum(:position).to_i + 1)
        end

        # Shift items at and below the target position down by 1
        @list.user_list_items.where('position >= ?', position).order(position: :desc).each do |item|
          item.update_column(:position, item.position + 1)
        end

        item = @list.user_list_items.build(book_id: book_id, position: position)
        if item.save
          render json: { list: serialize_list(@list.reload, include_items: true) }, status: :created
        else
          # Roll back the shifts we just made
          @list.user_list_items.where('position > ?', position).order(:position).each do |i|
            i.update_column(:position, i.position - 1)
          end
          render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/users/:user_id/lists/:id/items/:item_id
      def remove_item
        item = @list.user_list_items.find_by(id: params[:item_id])
        return render json: { error: 'Item not found' }, status: :not_found unless item

        removed_position = item.position
        item.destroy

        # Close the gap: shift items above the removed position up by 1
        @list.user_list_items.where('position > ?', removed_position).order(:position).each do |i|
          i.update_column(:position, i.position - 1)
        end

        render json: { list: serialize_list(@list.reload, include_items: true) }, status: :ok
      end

      # PATCH /api/v1/users/:user_id/lists/:id/reorder
      # Body: { items: [{ id: 1, position: 3 }, { id: 2, position: 1 }, ...] }
      # Uses a two-phase update to avoid unique-constraint violations when
      # swapping positions (e.g. 1↔2 would collide on the first UPDATE).
      # Phase 1 moves all affected items to safe temporary positions (1000+),
      # Phase 2 moves them to their intended final positions.
      def reorder
        items_params = params[:items]
        return render json: { error: 'items array is required' }, status: :unprocessable_entity unless items_params.is_a?(Array)

        # Validate no duplicate final positions
        positions = items_params.map { |i| i[:position].to_i }
        if positions.uniq.length != positions.length
          return render json: { error: 'Positions must be unique' }, status: :unprocessable_entity
        end

        # Verify all item IDs belong to this list before touching anything
        ids = items_params.map { |i| i[:id].to_i }
        unless @list.user_list_items.where(id: ids).count == ids.length
          return render json: { error: 'One or more items not found in this list' }, status: :not_found
        end

        ActiveRecord::Base.transaction do
          # Phase 1 — park all items at temp positions (>= 1000) so no two
          # items share a 1-10 slot simultaneously during phase 2.
          ids.each_with_index do |id, i|
            @list.user_list_items.where(id: id).update_all(position: 1000 + i)
          end

          # Phase 2 — set final positions now that the 1-10 range is clear.
          items_params.each do |item_param|
            @list.user_list_items
                 .where(id: item_param[:id].to_i)
                 .update_all(position: item_param[:position].to_i)
          end
        end

        render json: { list: serialize_list(@list.reload, include_items: true) }, status: :ok
      rescue ActiveRecord::RecordNotFound => e
        render json: { error: e.message }, status: :not_found
      end

      # POST /api/v1/users/:user_id/lists/:id/like
      def like
        return render_forbidden if current_user.id == @list.user_id
        return render json: { error: 'List not found' }, status: :not_found unless viewable?(@list)

        like = @list.user_list_likes.find_or_initialize_by(user: current_user)
        if like.new_record?
          like.save!
          render json: { liked: true, likes_count: @list.reload.likes_count }, status: :ok
        else
          render json: { liked: true, likes_count: @list.likes_count }, status: :ok
        end
      end

      # DELETE /api/v1/users/:user_id/lists/:id/unlike
      def unlike
        like = @list.user_list_likes.find_by(user: current_user)
        like&.destroy
        render json: { liked: false, likes_count: @list.reload.likes_count }, status: :ok
      end

      private

      def set_profile_user
        @profile_user = User.find(params[:user_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      def set_list
        @list = @profile_user.user_lists.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end

      def require_ownership!
        render_forbidden unless current_user.id == @list.user_id
      end

      def render_forbidden
        render json: { error: 'Forbidden' }, status: :forbidden
      end

      def viewable?(list)
        list.visibility == 'public' || (current_user && current_user.id == list.user_id)
      end

      def list_params
        params.require(:list).permit(:name, :description, :visibility, :list_type)
      end

      def serialize_list(list, include_items: false)
        data = {
          id:          list.id,
          list_type:   list.list_type,
          name:        list.name,
          description: list.description,
          visibility:  list.visibility,
          likes_count: list.likes_count,
          user_id:     list.user_id,
          created_at:  list.created_at,
          updated_at:  list.updated_at,
        }

        if current_user
          data[:liked_by_current_user] = list.user_list_likes.exists?(user: current_user)
        end

        if include_items
          data[:items] = list.user_list_items.ordered.includes(:book).map do |item|
            serialize_item(item)
          end
        else
          data[:items_count] = list.user_list_items.count
        end

        data
      end

      def serialize_item(item)
        book = item.book
        {
          id:       item.id,
          position: item.position,
          book: {
            id:              book.id,
            title:           book.title,
            cover_image_url: book.resolved_cover_url,
            author_name:     book.author&.name,
            google_books_id: book.google_books_id,
          }
        }
      end
    end
  end
end
