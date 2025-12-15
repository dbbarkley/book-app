class UnfollowService < BaseService
  def initialize(follower, follow_id)
    @follower = follower
    @follow_id = follow_id
  end

  private

  def execute
    follow = find_follow
    return unless follow

    if follow.destroy
      success!(follow)
    else
      failure!(follow.errors.full_messages)
    end
  end

  def find_follow
    follow = Follow.find_by(id: @follow_id, follower: @follower)
    unless follow
      failure!(['Follow not found'])
      return nil
    end
    follow
  end
end

