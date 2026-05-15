module Api
  module V1
    class BisacCategoriesController < BaseController
      skip_before_action :authenticate_user!, only: [:index, :books]

      # GET /api/v1/bisac_categories
      # Returns all active categories ordered for display.
      # Optionally filtered to top-level only with ?top_level=true.
      def index
        categories = BisacCategory.active.ordered
        categories = categories.top_level if params[:top_level] == 'true'

        render json: {
          categories: categories.map { |c| serialize_category(c) }
        }
      end

      # GET /api/v1/bisac_categories/:code/books
      # Returns cached books for this category from curated_shelf_books.
      #
      # This endpoint is read-only from a data-source perspective — it never
      # triggers a live call to Hardcover or any other external API. All shelf
      # data is written exclusively by BisacPopulatorJob, which runs on a
      # scheduled background job (weekly by default).
      #
      # If a shelf hasn't been populated yet, an empty books array is returned
      # with populated: false so the client can show an appropriate state.
      def books
        code     = params[:code].to_s.upcase.strip
        category = BisacCategory.active.find_by(code: code)

        return render json: { error: 'Category not found' }, status: :not_found unless category

        cached = CuratedShelfBook.for_shelf(code).with_cover.ranked

        render json: {
          code:           category.code,
          name:           category.name,
          books:          cached.map(&:as_api_json),
          populated:      category.last_populated_at.present?,
          last_populated: category.last_populated_at,
          stale:          category.stale?,
        }
      end

      private

      def serialize_category(category)
        {
          code:         category.code,
          name:         category.name,
          parent_code:  category.parent_code,
          color:        category.color,
          display_order: category.display_order,
          book_count:   category.curated_shelf_books.count,
          last_populated: category.last_populated_at,
          stale:        category.stale?,
        }
      end
    end
  end
end
