class BaseService
  attr_reader :result

  def self.call(*args, **kwargs)
    new(*args, **kwargs).call
  end

  def call
    @result = ServiceResult.new
    execute
    @result
  end

  private

  def execute
    raise NotImplementedError, "#{self.class} must implement #execute"
  end

  def success!(data = nil)
    @result.success = true
    @result.data = data
  end

  def failure!(errors)
    @result.success = false
    @result.errors = Array(errors)
  end
end

class ServiceResult
  attr_accessor :success, :data, :errors

  def initialize
    @success = false
    @errors = []
  end

  def success?
    @success
  end

  def failure?
    !@success
  end
end

