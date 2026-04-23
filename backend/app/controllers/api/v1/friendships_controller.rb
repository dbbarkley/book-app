module Api
  module V1
    class FriendshipsController < BaseController
      # GET /api/v1/friendships
      # Returns current user's accepted friends
      def index
        friends = current_user.friends
                              .select(:id, :username, :display_name, :avatar_url)
                              .order(:display_name, :username)
        render json: { friends: friends.map { |u| serialize_user(u) } }, status: :ok
      end

      # GET /api/v1/friendships/pending
      # Returns incoming friend requests (requestee = current_user, status = pending)
      def pending
        requests = current_user.received_friendships
                               .pending
                               .includes(:requester)
                               .order(created_at: :desc)
        render json: {
          requests: requests.map { |f| serialize_request(f) }
        }, status: :ok
      end

      # POST /api/v1/friendships
      # Send a friend request to another user.
      # Auto-accepts if the other user already sent a request to us.
      def create
        requestee = User.find(params[:user_id])

        # Can't friend yourself
        if requestee.id == current_user.id
          return render json: { error: 'Cannot send a friend request to yourself' }, status: :unprocessable_entity
        end

        # Already friends or request exists in either direction
        existing = Friendship.between(current_user, requestee).first
        if existing
          if existing.accepted?
            return render json: { error: 'Already friends' }, status: :unprocessable_entity
          elsif existing.requester_id == current_user.id
            return render json: { error: 'Friend request already sent' }, status: :unprocessable_entity
          else
            # They already sent us a request — auto-accept
            existing.update!(status: 'accepted')
            notify_friend_accepted(existing)
            return render json: { friendship: serialize_friendship(existing) }, status: :ok
          end
        end

        friendship = Friendship.create!(requester: current_user, requestee: requestee, status: 'pending')
        notify_friend_request(friendship)
        render json: { friendship: serialize_friendship(friendship) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PATCH /api/v1/friendships/:id
      # Accept a pending friend request (only the requestee can accept)
      def update
        friendship = current_user.received_friendships.pending.find(params[:id])
        friendship.update!(status: 'accepted')
        notify_friend_accepted(friendship)
        render json: { friendship: serialize_friendship(friendship) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Friend request not found' }, status: :not_found
      end

      # DELETE /api/v1/friendships/:id
      # Decline a pending request OR remove an accepted friendship.
      # Either party can do this.
      def destroy
        friendship = Friendship.involving(current_user).find(params[:id])
        friendship.destroy!
        render json: { message: 'Friendship removed' }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Friendship not found' }, status: :not_found
      end

      # GET /api/v1/friendships/status/:user_id
      # Returns friendship status between current_user and another user
      def status
        other = User.find(params[:user_id])
        render json: {
          status:        current_user.friendship_status_with(other),
          friendship_id: current_user.friendship_with(other)&.id
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      private

      def serialize_user(user)
        {
          id:           user.id,
          username:     user.username,
          display_name: user.display_name,
          avatar_url:   user.respond_to?(:avatar_url_with_attachment) ? user.avatar_url_with_attachment : user.avatar_url,
        }
      end

      def serialize_friendship(friendship)
        {
          id:           friendship.id,
          status:       friendship.status,
          requester_id: friendship.requester_id,
          requestee_id: friendship.requestee_id,
          created_at:   friendship.created_at,
        }
      end

      def serialize_request(friendship)
        {
          id:         friendship.id,
          created_at: friendship.created_at,
          requester:  serialize_user(friendship.requester),
        }
      end

      def notify_friend_request(friendship)
        Notification.create!(
          user:              friendship.requestee,
          notifiable:        friendship,
          notification_type: 'friend_request'
        )
      rescue => e
        Rails.logger.warn "[Friendships] Failed to create friend_request notification: #{e.message}"
      end

      def notify_friend_accepted(friendship)
        Notification.create!(
          user:              friendship.requester,
          notifiable:        friendship,
          notification_type: 'friend_accepted'
        )
      rescue => e
        Rails.logger.warn "[Friendships] Failed to create friend_accepted notification: #{e.message}"
      end
    end
  end
end
