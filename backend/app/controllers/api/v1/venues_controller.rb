module Api
  module V1
    class VenuesController < ApplicationController
      include Authenticable
      skip_before_action :authenticate_user!, only: [:index, :show]

      def index
        venues = Venue.active
        
        if params[:zipcode].present?
          venues = venues.by_zipcode(params[:zipcode])
        elsif params[:city].present? && params[:state].present?
          venues = venues.by_location(params[:city], params[:state])
        end

        render json: { venues: venues }, status: :ok
      end

      def show
        venue = Venue.find(params[:id])
        render json: { venue: venue }, status: :ok
      end
    end
  end
end

