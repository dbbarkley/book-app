# frozen_string_literal: true

# Import model for tracking user data imports from external sources
# Supports Goodreads CSV import (StoryGraph can be added later)
#
# Status flow:
#   pending -> processing -> completed/failed
#
# The job processes imports asynchronously to handle large CSV files
# without blocking the request/response cycle.
class Import < ApplicationRecord
  belongs_to :user

  # Statuses
  PENDING = 'pending'
  PROCESSING = 'processing'
  COMPLETED = 'completed'
  FAILED = 'failed'

  STATUSES = [PENDING, PROCESSING, COMPLETED, FAILED].freeze

  # Sources
  GOODREADS = 'goodreads'
  STORYGRAPH = 'storygraph' # Future implementation
  
  SOURCES = [GOODREADS, STORYGRAPH].freeze

  validates :source, presence: true, inclusion: { in: SOURCES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :user, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  # Check if import is in progress
  def processing?
    status == PROCESSING
  end

  # Check if import is complete
  def completed?
    status == COMPLETED
  end

  # Check if import failed
  def failed?
    status == FAILED
  end

  # Calculate progress percentage
  def progress_percentage
    return 0 if total_books.zero?
    ((processed_books.to_f / total_books) * 100).round
  end

  # Mark import as started
  def mark_as_processing!
    update!(
      status: PROCESSING,
      started_at: Time.current
    )
  end

  # Mark import as completed
  def mark_as_completed!
    update!(
      status: COMPLETED,
      completed_at: Time.current
    )
  end

  # Mark import as failed
  def mark_as_failed!(error)
    update!(
      status: FAILED,
      error_message: error.to_s,
      completed_at: Time.current
    )
  end

  # Update progress
  def update_progress!(processed:, successful: 0, failed: 0)
    update!(
      processed_books: processed,
      successful_imports: successful,
      failed_imports: failed
    )
  end

  # Get summary for API response
  def summary
    {
      id: id,
      source: source,
      status: status,
      filename: filename,
      total_books: total_books,
      processed_books: processed_books,
      successful_imports: successful_imports,
      failed_imports: failed_imports,
      progress_percentage: progress_percentage,
      metadata: metadata,
      error_message: error_message,
      started_at: started_at,
      completed_at: completed_at,
      created_at: created_at
    }
  end
end

