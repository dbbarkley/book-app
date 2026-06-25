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
    url = BookCoverService.new(@book).find_best_cover[:url]

    unless url.present?
      @book.update_column(:cover_last_enriched_at, Time.current)
      return false
    end

    data, content_type = fetch(url)

    unless data && valid?(data)
      @book.update_column(:cover_last_enriched_at, Time.current)
      return false
    end

    path = storage_path
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

  def fetch(url)
    uri = URI(url)
    response = Net::HTTP.start(
      uri.hostname, uri.port,
      use_ssl:      uri.scheme == 'https',
      open_timeout: 5,
      read_timeout: 10
    ) { |http| http.get(uri.request_uri) }

    return nil unless response.is_a?(Net::HTTPSuccess)

    content_type = response['content-type']&.split(';')&.first&.strip
    return nil unless content_type&.start_with?('image/')

    [response.body, content_type]
  end

  def valid?(data)
    return false if data.bytesize < MIN_BYTES
    return false if data.bytesize > MAX_BYTES
    return false if PLACEHOLDER_HASHES.include?(Digest::MD5.hexdigest(data))
    return false unless dimensions_ok?(data)

    true
  end

  def dimensions_ok?(data)
    info = FastImage.size(StringIO.new(data))
    return true unless info  # unknown format — don't reject

    info[0] >= MIN_DIMENSION && info[1] >= MIN_DIMENSION
  rescue StandardError
    true
  end

  def storage_path
    id = @book.isbn.presence || @book.google_books_id.presence || @book.id.to_s
    "covers/#{id}.jpg"
  end
end
