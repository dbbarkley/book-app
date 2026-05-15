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
      # Build a SQL UNION of three sources so deduplication happens in the DB,
      # not in Ruby memory.  Guard against a nil author_id to avoid a bad query.
      queries = [
        User.joins(:follows)
            .where(follows: { followable_type: 'Book', followable_id: feedable.id })
            .select(:id)
            .to_sql,
        User.joins(:user_books)
            .where(user_books: { book_id: feedable.id })
            .select(:id)
            .to_sql,
      ]

      if feedable.author_id.present?
        queries << User.joins(:follows)
                       .where(follows: { followable_type: 'Author', followable_id: feedable.author_id })
                       .select(:id)
                       .to_sql
      end

      User.where(id: User.from("(#{queries.join(' UNION ')}) AS u").select(:id))
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

