# frozen_string_literal: true

class ImageStorageService
  def self.upload(path, data, content_type: 'image/jpeg')
    client.put_object(
      bucket:        ENV['R2_BUCKET'],
      key:           path,
      body:          data,
      content_type:  content_type,
      cache_control: 'public, max-age=300'
    )
  end

  def self.url_for(path)
    "#{ENV['R2_PUBLIC_URL']}/#{path}"
  end

  def self.exists?(path)
    client.head_object(bucket: ENV['R2_BUCKET'], key: path)
    true
  rescue Aws::S3::Errors::NotFound
    false
  end

  def self.delete(path)
    client.delete_object(bucket: ENV['R2_BUCKET'], key: path)
  end

  def self.client
    @client ||= Aws::S3::Client.new(
      endpoint:          ENV['R2_ENDPOINT'],
      access_key_id:     ENV['R2_ACCESS_KEY_ID'],
      secret_access_key: ENV['R2_SECRET_ACCESS_KEY'],
      region:            'auto',
      force_path_style:  true
    )
  end
  private_class_method :client
end
