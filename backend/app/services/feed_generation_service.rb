class FeedGenerationService < BaseService
  def initialize(feedable_type, feedable_id, activity_type, metadata = {})
    @feedable_type = feedable_type
    @feedable_id = feedable_id
    @activity_type = activity_type
    @metadata = metadata
  end

  private

  def execute
    feedable = find_feedable
    return unless feedable

    followers = find_followers(feedable)
    return if followers.empty?

    created_items = create_feed_items(followers, feedable)
    success!(created_items)
  end

  def find_feedable
    case @feedable_type
    when 'Book'
      Book.find(@feedable_id)
    when 'Event'
      Event.find(@feedable_id)
    when 'Author'
      Author.find(@feedable_id)
    else
      failure!(['Invalid feedable type'])
      nil
    end
  rescue ActiveRecord::RecordNotFound
    failure!(['Resource not found'])
    nil
  end

  def find_followers(feedable)
    case feedable
    when Book
      # Followers of book + followers of author
      book_followers = User.joins(:follows)
                          .where(follows: { followable: feedable })
      author_followers = User.joins(:follows)
                            .where(follows: { followable: feedable.author })
      (book_followers + author_followers).uniq
    when Event
      # Followers of author
      User.joins(:follows)
          .where(follows: { followable: feedable.author })
          .distinct
    when Author
      # Followers of author
      User.joins(:follows)
          .where(follows: { followable: feedable })
          .distinct
    else
      []
    end
  end

  def create_feed_items(followers, feedable)
    items = followers.map do |follower|
      FeedItem.find_or_create_by(
        user: follower,
        feedable: feedable,
        activity_type: @activity_type
      ) do |item|
        item.metadata = @metadata
      end
    end

    items.select(&:persisted?)
  end
end

