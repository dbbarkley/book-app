# frozen_string_literal: true

require 'net/http'

# Fetches missing descriptions from the OpenLibrary works API and writes them
# into book_catalog. Enqueued fire-and-forget after search results are returned,
# so search latency is unaffected.
#
# Only processes books that are already in book_catalog and have no description.
# OL descriptions can be a plain string or {"type": "/type/text", "value": "..."}.
class OlDescriptionEnrichmentJob < ApplicationJob
  queue_as :low_priority

  OL_OPEN_TIMEOUT = 5
  OL_READ_TIMEOUT = 8

  def perform(google_books_ids)
    Array(google_books_ids).each do |gbid|
      next unless gbid.to_s.start_with?('ol_')

      catalog = BookCatalog.find_by(google_books_id: gbid)
      next unless catalog
      next if catalog.description.present?

      description = fetch_ol_description(gbid)
      if description.present?
        catalog.update_column(:description, description)
        Rails.logger.info("[OlDescriptionEnrichmentJob] filled description for #{gbid}")
      end
    rescue => e
      Rails.logger.warn("[OlDescriptionEnrichmentJob] failed for #{gbid}: #{e.message}")
    end
  end

  private

  def fetch_ol_description(gbid)
    # gbid is "ol_12345W" → works key is "OL12345W"
    ol_key = gbid.delete_prefix('ol_')
    works_key = ol_key.start_with?('OL') ? ol_key : "OL#{ol_key}"
    uri = URI("https://openlibrary.org/works/#{works_key}.json")

    http = Net::HTTP.new(uri.host, 443)
    http.use_ssl     = true
    http.open_timeout = OL_OPEN_TIMEOUT
    http.read_timeout = OL_READ_TIMEOUT

    response = http.get(uri.request_uri, { 'Accept' => 'application/json' })
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    desc = data['description']
    text = desc.is_a?(Hash) ? desc['value'] : desc
    text.to_s.strip.presence
  rescue => e
    Rails.logger.warn("[OlDescriptionEnrichmentJob] OL fetch failed for #{gbid}: #{e.message}")
    nil
  end
end
