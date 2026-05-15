class BackfillWorksJob < ApplicationJob
  queue_as :low_priority

  def perform
    total   = Book.where(work_id: nil).count
    updated = 0
    errors  = []

    Rails.logger.info "BackfillWorksJob: #{total} books need work assignment"

    Book.includes(:author).where(work_id: nil).find_each do |book|
      work = WorkResolutionService.resolve(
        google_books_id: book.google_books_id,
        isbn:            book.isbn,
        title:           book.title,
        author:          book.author_name,
        description:     book.description,
        cover_image_url: book.cover_image_url,
        page_count:      book.page_count,
      )

      book.update_columns(work_id: work.id)
      updated += 1
    rescue => e
      errors << "book #{book.id} (#{book.title.inspect}): #{e.message}"
      Rails.logger.error "BackfillWorksJob: #{errors.last}"
    end

    Rails.logger.info "BackfillWorksJob: done — #{updated} assigned, #{errors.size} errors"
    errors.each { |msg| Rails.logger.error "  #{msg}" } if errors.any?
  end
end
