module Api
  module V1
    class ReleaseRemindersController < BaseController
      def create
        upcoming_release = UpcomingRelease.find_by(id: params[:upcoming_release_id])
        return render json: { error: 'Upcoming release not found' }, status: :not_found unless upcoming_release

        reminder = ReleaseReminder.new(user: current_user, upcoming_release: upcoming_release)

        if reminder.save
          render json: { id: reminder.id }, status: :created
        else
          render json: { errors: reminder.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        reminder = current_user.release_reminders.find_by(id: params[:id])
        return render json: { error: 'Reminder not found' }, status: :not_found unless reminder

        if reminder.destroy
          head :no_content
        else
          render json: { errors: reminder.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
