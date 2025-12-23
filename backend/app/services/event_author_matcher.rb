class EventAuthorMatcher
  def initialize(event)
    @event = event
  end

  def match_authors!
    # Simple name-based matching
    # In a production system, this would be more sophisticated (NLP, etc.)
    
    potential_author_names = extract_names(@event.title + " " + (@event.description || ""))
    
    potential_author_names.each do |name|
      # Look for exact name match or alias
      author = Author.find_by("LOWER(name) = ?", name.downcase)
      
      if author
        create_event_author(author, confidence_score: 0.8)
      end
    end
  end

  private

  def extract_names(text)
    # Very basic regex for capitalized word sequences (e.g. "John Doe")
    # This is a placeholder for more robust name extraction logic
    text.scan(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/).uniq
  end

  def create_event_author(author, confidence_score:)
    EventAuthor.find_or_create_by!(
      event: @event,
      author: author
    ) do |ea|
      ea.confidence_score = confidence_score
    end
  end
  
  # Non-blocking best-effort matching helps link local events to the social graph.
end

