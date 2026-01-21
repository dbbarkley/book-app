class BookDeduplicationService < BaseService
  def initialize(books)
    @books = books || []
  end

  private

  def execute
    deduplicated = @books.uniq do |book|
      # Normalize title and author for comparison
      normalize(book[:title]) + normalize(book[:author_name])
    end

    success!(deduplicated)
  end

  def normalize(text)
    return "" unless text
    # Remove special characters, extra spaces, and lowercase
    text.to_s.downcase.gsub(/[^a-z0-9]/, '').strip
  end
end

