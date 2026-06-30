# frozen_string_literal: true

require 'net/http'
require 'digest'

class CoverDownloadService
  MAX_BYTES     = 10.megabytes
  MIN_BYTES     = 5.kilobytes
  MIN_DIMENSION = 80

  # MD5 hashes of known placeholder images that must never be stored to R2.
  # d41d8cd98f00b204e9800998ecf8427e — empty file
  # a64fa89d7ebc97075c1d363fc5fea71f — Google Books "No preview available" PNG (575x750, zoom=0)
  # 0d23d0b62908b75e89014ac3f864484e — Open Library 1x1 transparent GIF (no cover)
  PLACEHOLDER_HASHES = %w[
    d41d8cd98f00b204e9800998ecf8427e
    a64fa89d7ebc97075c1d363fc5fea71f
    0d23d0b62908b75e89014ac3f864484e
  ].freeze

  SOURCES = %w[serper google openlibrary].freeze

  def initialize(book, source: nil)
    @book   = book
    @source = source&.to_s
    raise ArgumentError, "Unknown source #{@source.inspect}. Valid: #{SOURCES.join(', ')}" if @source && !SOURCES.include?(@source)
  end

  def call
    # If R2 already has a cover at the expected path, sync the DB and skip the download.
    # Useful when local and production share the same bucket — avoids re-uploading.
    %w[jpg png webp gif].each do |ext|
      id   = @book.isbn.presence || @book.google_books_id.presence || @book.id.to_s
      path = "covers/#{id}.#{ext}"
      if ImageStorageService.exists?(path)
        warn "book=#{@book.id}: R2 already has #{path} — syncing DB, skipping download"
        @book.update_columns(
          cover_storage_path:     path,
          cover_image_source:     'r2',
          cover_last_enriched_at: Time.current
        )
        return true
      end
    end

    book_cover_service = BookCoverService.new(@book)
    url = data = content_type = nil

    if @source
      url, data, content_type = fetch_from_source(book_cover_service, @source)
    else
      # Priority order: existing cover_image_url (what the user saw) → Google Books / Open Library → Serper
      # Serper is last so we don't silently swap in a different edition's cover.
      url, data, content_type = try_existing_url

      unless data
        best_url = book_cover_service.find_best_cover[:url]
        if best_url.present?
          data, content_type = fetch(best_url)
          url = best_url if data
        end
      end

      unless data
        url, data, content_type = book_cover_service.try_image_search_download(self)
      end
    end

    unless data
      warn "book=#{@book.id} (#{@book.title.inspect}): all sources failed"
      @book.update_column(:cover_last_enriched_at, Time.current)
      return false
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
    warn "book=#{@book.id}: exception — #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    @book.update_column(:cover_last_enriched_at, Time.current) rescue nil
    false
  end

  private

  def fetch_from_source(book_cover_service, source)
    case source
    when 'serper'
      book_cover_service.try_image_search_download(self)
    when 'google'
      result = book_cover_service.try_google_books
      return [nil, nil, nil] unless result&.dig(:url)
      data, content_type = fetch(result[:url])
      data ? [result[:url], data, content_type] : [nil, nil, nil]
    when 'openlibrary'
      result = book_cover_service.try_open_library
      return [nil, nil, nil] unless result&.dig(:url)
      data, content_type = fetch(result[:url])
      data ? [result[:url], data, content_type] : [nil, nil, nil]
    end
  end

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
      warn "book=#{@book.id}: HTTP #{response.code} from #{url}"
      return nil
    end

    content_type = response['content-type']&.split(';')&.first&.strip
    unless content_type&.start_with?('image/')
      warn "book=#{@book.id}: non-image content-type '#{content_type}' from #{url}"
      return nil
    end

    [response.body, content_type]
  end

  def valid?(data, url)
    if data.bytesize < MIN_BYTES
      warn "book=#{@book.id} (#{@book.title.inspect}): rejected — too small (#{data.bytesize}B < #{MIN_BYTES}B) url=#{url}"
      return false
    end
    if data.bytesize > MAX_BYTES
      warn "book=#{@book.id} (#{@book.title.inspect}): rejected — too large (#{data.bytesize}B) url=#{url}"
      return false
    end
    if PLACEHOLDER_HASHES.include?(Digest::MD5.hexdigest(data))
      warn "book=#{@book.id} (#{@book.title.inspect}): rejected — known placeholder hash url=#{url}"
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
      warn "book=#{@book.id} (#{@book.title.inspect}): rejected — dimensions too small (#{info[0]}x#{info[1]}) url=#{url}"
      return false
    end
    true
  rescue StandardError
    true
  end

  def warn(msg)
    tagged = "[CoverDownload] #{msg}"
    Rails.logger.warn(tagged)
    puts tagged
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
