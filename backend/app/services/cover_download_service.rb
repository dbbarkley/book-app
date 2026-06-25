# frozen_string_literal: true

require 'net/http'
require 'digest'

class CoverDownloadService
  MAX_BYTES     = 10.megabytes
  MIN_BYTES     = 5.kilobytes
  MIN_DIMENSION = 80

  # MD5 hashes of known placeholder images.
  # d41d8cd98f00b204e9800998ecf8427e is the MD5 of an empty string/file.
  # Add new hashes here when you encounter fake covers in production.
  PLACEHOLDER_HASHES = %w[
    d41d8cd98f00b204e9800998ecf8427e
  ].freeze

  def initialize(book)
    @book = book
  end

  def call
    # Fast path: try the stored cover_image_url first — avoids an API call for
    # the majority of books that already have a valid URL in the DB.
    url, data, content_type = try_existing_url
    unless data
      # Fall back to fresh source search (Google Books API, then Open Library)
      url = BookCoverService.new(@book).find_best_cover[:url]

      unless url.present?
        Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): no cover URL found")
        @book.update_column(:cover_last_enriched_at, Time.current)
        return false
      end

      data, content_type = fetch(url)

      unless data
        Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): fetch failed or non-image response — url=#{url}")
        @book.update_column(:cover_last_enriched_at, Time.current)
        return false
      end
    end

    unless valid?(data, url)
      @book.update_column(:cover_last_enriched_at, Time.current)
      return false
    end

    path = storage_path(content_type)
    ImageStorageService.upload(path, data, content_type: content_type)

    @book.update_columns(
      cover_storage_path:     path,
      cover_image_source:     'r2',
      cover_last_enriched_at: Time.current
    )

    true
  rescue StandardError => e
    Rails.logger.warn("[CoverDownload] Failed for book #{@book.id}: #{e.message}")
    @book.update_column(:cover_last_enriched_at, Time.current) rescue nil
    false
  end

  private

  def try_existing_url
    return [nil, nil, nil] if @book.cover_image_url.blank?
    url = @book.cover_image_url
    data, content_type = fetch(url)
    return [nil, nil, nil] unless data
    [url, data, content_type]
  end

  def fetch(url)
    uri = URI(url)
    response = Net::HTTP.start(
      uri.hostname, uri.port,
      use_ssl:      uri.scheme == 'https',
      open_timeout: 5,
      read_timeout: 10
    ) { |http| http.get(uri.request_uri) }

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn("[CoverDownload] book=#{@book.id}: HTTP #{response.code} from #{url}")
      return nil
    end

    content_type = response['content-type']&.split(';')&.first&.strip
    unless content_type&.start_with?('image/')
      Rails.logger.warn("[CoverDownload] book=#{@book.id}: non-image content-type '#{content_type}' from #{url}")
      return nil
    end

    [response.body, content_type]
  end

  def valid?(data, url)
    if data.bytesize < MIN_BYTES
      Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): rejected — too small (#{data.bytesize}B < #{MIN_BYTES}B) url=#{url}")
      return false
    end
    if data.bytesize > MAX_BYTES
      Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): rejected — too large (#{data.bytesize}B) url=#{url}")
      return false
    end
    if PLACEHOLDER_HASHES.include?(Digest::MD5.hexdigest(data))
      Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): rejected — known placeholder hash url=#{url}")
      return false
    end
    unless dimensions_ok?(data, url)
      return false
    end
    true
  end

  def dimensions_ok?(data, url)
    info = FastImage.size(StringIO.new(data))
    return true unless info  # unknown format — don't reject

    if info[0] < MIN_DIMENSION || info[1] < MIN_DIMENSION
      Rails.logger.warn("[CoverDownload] book=#{@book.id} (#{@book.title.inspect}): rejected — dimensions too small (#{info[0]}x#{info[1]}) url=#{url}")
      return false
    end
    true
  rescue StandardError
    true
  end

  def storage_path(content_type)
    ext = case content_type
          when 'image/png'  then 'png'
          when 'image/gif'  then 'gif'
          when 'image/webp' then 'webp'
          else                   'jpg'
          end
    id = @book.isbn.presence || @book.google_books_id.presence || @book.id.to_s
    "covers/#{id}.#{ext}"
  end
end
