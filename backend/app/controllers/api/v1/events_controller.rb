module Api
  module V1
    class EventsController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show]

      def index
        # Filter logic for geographic discovery
        # If user is authenticated and no location is provided, use user's zipcode
        zipcode = params[:zipcode] || (current_user&.zipcode if defined?(current_user))
        
        events = Event.includes(:venue, :authors, :book).all
        
        if zipcode.present?
          events = events.by_zipcode(zipcode, params[:radius])
        elsif params[:city].present? && params[:state].present?
          events = events.by_city(params[:city], params[:state])
        end

        events = events.upcoming if params[:upcoming] == 'true'
        events = events.by_author(params[:author_id]) if params[:author_id].present?
        events = events.starts_after(params[:starts_after]) if params[:starts_after].present?
        events = events.where(audience_type: params[:audience_type]) if params[:audience_type].present?

        # Handle pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        
        total_count = events.count
        events = events.order(starts_at: :asc).limit(per_page).offset((page - 1) * per_page)

        render json: {
          events: serialize_events(events),
          pagination: {
            page: page,
            per_page: per_page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count
          }
        }, status: :ok
      end

      def show
        event = Event.includes(:venue, :authors, :book).find(params[:id])
        render json: { event: serialize_event_detail(event) }, status: :ok
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
          audience_type: event.audience_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          is_virtual: event.is_virtual,
          image_url: event.image_url,
          location: event.location,
          external_url: event.external_url,
          venue_name: event.venue&.name || event.venue_name,
          venue: event.venue ? serialize_venue_basic(event.venue) : nil,
          author_name: event.authors.first&.name || event.author&.name # Support multi-author or legacy
        }
      end

      def serialize_event_detail(event)
        {
          id: event.id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          audience_type: event.audience_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          is_virtual: event.is_virtual,
          image_url: event.image_url,
          location: event.location,
          external_url: event.external_url,
          venue: event.venue ? serialize_venue_detail(event.venue) : nil,
          authors: event.authors.map { |a| { id: a.id, name: a.name, avatar_url: a.avatar_url } },
          book: event.book ? {
            id: event.book.id,
            title: event.book.title,
            cover_image_url: event.book.cover_image_url
          } : nil
        }
      end

      def serialize_venue_basic(venue)
        { id: venue.id, name: venue.name, city: venue.city, state: venue.state }
      end

      def serialize_venue_detail(venue)
        {
          id: venue.id,
          name: venue.name,
          venue_type: venue.venue_type,
          address: venue.address,
          city: venue.city,
          state: venue.state,
          zipcode: venue.zipcode
        }
      end
    end
  end
end
