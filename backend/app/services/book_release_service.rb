class BookReleaseService < BaseService
  def initialize(book, release_date = nil)
    @book = book
    @release_date = release_date || book.release_date
  end

  private

  def execute
    return unless @book.persisted?

    was_future = @book.release_date&.future?
    @book.update(release_date: @release_date) unless @release_date == @book.release_date

    is_now_released = @release_date <= Date.current && was_future

    if is_now_released || @book.release_date == Date.current
      enqueue_feed_generation
      enqueue_notifications
    end

    success!(@book)
  end

  def enqueue_feed_generation
    GenerateFeedItemsJob.perform_later(
      'Book',
      @book.id,
      'book_release',
      { book_title: @book.title, author_name: @book.author.name }
    )
  end

  def enqueue_notifications
    NotificationService.new(
      notifiable: @book,
      notification_type: 'book_release'
    ).create_for_followers
  end
end

