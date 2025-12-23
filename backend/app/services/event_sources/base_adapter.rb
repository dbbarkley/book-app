module EventSources
  class BaseAdapter
    def fetch_events(venue:)
      raise NotImplementedError, "#{self.class} must implement fetch_events"
    end

    protected

    def normalize_event(raw_event)
      raise NotImplementedError, "#{self.class} must implement normalize_event"
    end

    # All event sources implement the same interface.
    # Jobs don’t care where data comes from; adapters don’t care who asked.
  end
end

