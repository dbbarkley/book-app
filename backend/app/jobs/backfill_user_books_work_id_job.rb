class BackfillUserBooksWorkIdJob < ApplicationJob
  queue_as :low_priority

  def perform
    total   = UserBook.where(work_id: nil).count
    updated = 0
    skipped = 0
    errors  = []

    Rails.logger.info "BackfillUserBooksWorkIdJob: #{total} user_books need work_id"

    UserBook.includes(book: :work).where(work_id: nil).find_each do |ub|
      work_id = ub.book&.work_id
      if work_id
        ub.update_column(:work_id, work_id)
        updated += 1
      else
        skipped += 1
        errors << "user_book #{ub.id} (book_id=#{ub.book_id}): book has no work_id"
        Rails.logger.warn "BackfillUserBooksWorkIdJob: #{errors.last}"
      end
    end

    Rails.logger.info "BackfillUserBooksWorkIdJob: done — #{updated} updated, #{skipped} skipped"
  end
end
