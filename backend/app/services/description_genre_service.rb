require 'net/http'
require 'json'

# Classifies a book's genre from its description using the Claude API.
# Used as a last resort when Wikidata and Open Library have no data —
# common for indie, self-published, or obscure titles.
#
# Costs ~$0.001–0.003 per book at current Claude Haiku pricing.
# Result is cached by storing into books.categories so we never re-classify.
#
# Usage:
#   genres = DescriptionGenreService.classify(book)
#   # => ["Romance", "Contemporary fiction"]
#
class DescriptionGenreService
  API_URL = 'https://api.anthropic.com/v1/messages'

  PROMPT = <<~PROMPT.freeze
    You are a book genre classifier. Given a book's title, author, and description,
    return a JSON array of 1–4 genre labels that best describe the book.

    Use only genres from this list (return the exact strings):
    Science Fiction, Fantasy, Romance, Mystery & Thriller, Horror,
    Historical Fiction, Literary Fiction, Contemporary Fiction,
    Young Adult, Children's Fiction, Biography, History, Science,
    Self-Help, Business, Psychology, Philosophy, True Crime,
    Humor, Cooking, Travel, Nature, Religion, Graphic Novel, Classics

    Rules:
    - Return ONLY a JSON array, no explanation. Example: ["Romance", "Contemporary Fiction"]
    - Pick the most specific genres that apply (1–3 is ideal)
    - If the description is too vague or missing, return []
    - Do not invent genres outside the list above
  PROMPT

  def self.classify(book)
    return nil if ENV['ANTHROPIC_API_KEY'].blank?
    return nil if book.description.blank?

    user_message = <<~MSG
      Title: #{book.title}
      Author: #{book.author&.name || 'Unknown'}
      Description: #{book.description.truncate(600)}
    MSG

    response = call_api(user_message)
    return nil unless response

    genres = JSON.parse(response.match(/\[.*?\]/m)&.to_s || '[]')
    genres.is_a?(Array) ? genres.reject(&:blank?).first(4).presence : nil
  rescue JSON::ParserError, => e
    Rails.logger.warn "DescriptionGenreService parse error: #{e.message}"
    nil
  rescue => e
    Rails.logger.warn "DescriptionGenreService error: #{e.message}"
    nil
  end

  def self.call_api(user_message)
    uri  = URI(API_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl     = true
    http.open_timeout = 10
    http.read_timeout = 20

    request = Net::HTTP::Post.new(uri)
    request['Content-Type']      = 'application/json'
    request['x-api-key']         = ENV['ANTHROPIC_API_KEY']
    request['anthropic-version'] = '2023-06-01'

    request.body = {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system:     PROMPT,
      messages:   [{ role: 'user', content: user_message }]
    }.to_json

    response = http.request(request)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    data.dig('content', 0, 'text')
  rescue => e
    Rails.logger.warn "DescriptionGenreService API error: #{e.message}"
    nil
  end
end
