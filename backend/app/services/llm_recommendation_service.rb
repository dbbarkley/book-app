class LlmRecommendationService < BaseService
  OPENAI_URL = "https://api.openai.com/v1/chat/completions"

  def initialize(user)
    @user = user
    @api_key = ENV['OPENAI_API_KEY']
  end

  def call
    return { error: "OpenAI API key not set" } if @api_key.blank?

    response = HTTParty.post(
      OPENAI_URL,
      headers: {
        "Content-Type" => "application/json",
        "Authorization" => "Bearer #{@api_key}"
      },
      body: payload.to_json
    )

    if response.success?
      parse_response(response.parsed_response)
    else
      Rails.logger.error("LLM Recommendation Error: #{response.body}")
      { error: "Failed to get recommendations from LLM" }
    end
  rescue StandardError => e
    Rails.logger.error("LLM Recommendation Exception: #{e.message}")
    { error: e.message }
  end

  private

  def payload
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    }
  end

  def system_prompt
    <<~PROMPT
      You are a world-class book recommendation engine. 
      Your goal is to suggest books and authors that a user would love based on their reading history and preferences.
      
      Respond ONLY in JSON format with the following structure:
      {
        "books": [
          { "title": "Book Title", "author": "Author Name", "reason": "1-sentence reason why" }
        ],
        "authors": [
          { "name": "Author Name", "reason": "1-sentence reason why" }
        ]
      }
    PROMPT
  end

  def user_prompt
    genres = @user.preferences['selected_genres'] || []
    reading_history = @user.user_books.includes(book: :author).limit(10).map do |ub| 
      "#{ub.book.title} by #{ub.book.author&.name}"
    end
    followed_authors = @user.followed_authors.limit(10).pluck(:name)

    <<~PROMPT
      User Preferences:
      - Favorite Genres: #{genres.join(', ')}
      - Reading History: #{reading_history.join(', ')}
      - Followed Authors: #{followed_authors.join(', ')}

      Please provide 5 book recommendations and 3 author recommendations. 
      Be creative but accurate. The reasons should be personalized to the user's data.
    PROMPT
  end

  def parse_response(json)
    content = JSON.parse(json.dig("choices", 0, "message", "content"))
    {
      books: content["books"] || [],
      authors: content["authors"] || []
    }
  rescue JSON::ParserError => e
    Rails.logger.error("LLM JSON Parse Error: #{e.message}")
    { error: "Invalid JSON from LLM" }
  end
end

