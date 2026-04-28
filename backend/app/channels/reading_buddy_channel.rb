class ReadingBuddyChannel < ApplicationCable::Channel
  def subscribed
    session = ReadingBuddySession.find_by(id: params[:session_id])

    if session&.participant?(current_user)
      stream_from "reading_buddy_session_#{params[:session_id]}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
