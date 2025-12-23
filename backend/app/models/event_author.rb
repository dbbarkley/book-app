class EventAuthor < ApplicationRecord
  belongs_to :event
  belongs_to :author

  validates :event_id, uniqueness: { scope: :author_id }
end

