module Api
  module V1
    class EventsController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show]

      def index
        events = Event.includes(:author, :book).all

        events = events.upcoming if params[:upcoming] == 'true'
        events = events.by_author(params[:author_id]) if params[:author_id].present?
        events = events.starts_after(params[:starts_after]) if params[:starts_after].present?

        events = events.order(starts_at: :asc)

        render json: serialize_events(events), status: :ok
      end

      def show
        event = Event.includes(:author, :book).find(params[:id])
        render json: serialize_event_detail(event), status: :ok
      end

      private

      def serialize_events(events)
        events.map { |event| serialize_event(event) }
      end

      def serialize_event(event)
        {
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location: event.location,
          author_name: event.author.name
        }
      end

      def serialize_event_detail(event)
        {
          id: event.id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location: event.location,
          author: {
            id: event.author.id,
            name: event.author.name,
            avatar_url: event.author.avatar_url
          },
          book: event.book ? {
            id: event.book.id,
            title: event.book.title,
            cover_image_url: event.book.cover_image_url
          } : nil
        }
      end
    end
  end
end

