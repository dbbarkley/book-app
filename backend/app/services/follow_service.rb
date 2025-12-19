class FollowService < BaseService
  def initialize(follower, followable_type, followable_id)
    @follower = follower
    @followable_type = followable_type
    @followable_id = followable_id
  end

  private

  def execute
    followable = find_followable
    return unless followable

    if already_following?(followable)
      failure!(['Already following this resource'])
      return
    end

    follow = create_follow(followable)
    if follow.persisted?
      enqueue_backfill_job(follow)
      enqueue_user_follow_activity(follow)
      success!(follow)
    else
      failure!(follow.errors.full_messages)
    end
  end

  def find_followable
    case @followable_type
    when 'User'
      User.find(@followable_id)
    when 'Author'
      Author.find(@followable_id)
    when 'Book'
      Book.find(@followable_id)
    else
      failure!(['Invalid followable type'])
      nil
    end
  rescue ActiveRecord::RecordNotFound
    failure!(['Resource not found'])
    nil
  end

  def already_following?(followable)
    Follow.exists?(
      follower: @follower,
      followable: followable
    )
  end

  def create_follow(followable)
    Follow.create(
      follower: @follower,
      followable: followable
    )
  rescue ActiveRecord::RecordNotUnique
    failure!(['Already following this resource'])
    Follow.new
  end

  def enqueue_backfill_job(follow)
    BackfillFeedItemsJob.perform_later(
      @follower.id,
      follow.followable_type,
      follow.followable_id
    )
  end

  def enqueue_user_follow_activity(follow)
    return unless follow.followable_type == 'User'

    target_user = follow.followable
    return unless target_user

    GenerateUserActivityFeedItemsJob.perform_later(
      @follower.id,
      'User',
      target_user.id,
      'follow_activity',
      target_user: {
        id: target_user.id,
        username: target_user.username,
        display_name: target_user.display_name,
        avatar_url: target_user.avatar_url
      }
    )
  end
end

