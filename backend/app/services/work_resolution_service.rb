class WorkResolutionService
  # Returns a Work, always. Creates one if no match is found.
  # Attrs: google_books_id, isbn, hardcover_id, hardcover_slug, ol_work_id,
  #        title, author, description, cover_image_url, page_count, first_published_year
  def self.resolve(attrs)
    new(attrs).resolve
  end

  SUBTITLE_GENRE_RE = /novel|memoir|thriller|story|tale|narrative/.freeze

  def self.normalize_title(title)
    return '' if title.blank?
    t = title.to_s.downcase.strip
    # 1. Strip leading articles
    t = t.sub(/\A(the|a|an)\s+/, '')
    # 2. Strip ALL trailing parenthetical/bracket content — always edition or series metadata,
    #    never needed to distinguish works. Handles: "(A Novel)", "(Urania Jumbo)", "(Book 1)"
    t = t.gsub(/\s*[\(\[][^\(\[]*[\)\]]\s*\z/, '')
    # 3. Strip subtitle after any separator when it ends with "edition" (the clearest signal).
    #    Handles: ": Classroom Edition", ". Illustrated Edition", "- Anniversary Edition"
    t = t.gsub(/\s*[:\.\-–—;]\s+.+\bedition\s*\z/i, '')
    # 4. Strip "tie-in" marketing suffixes
    #    Handles: ". Movie Tie-In", ": Movie Tie-In Edition" (edition already caught above)
    t = t.gsub(/\s*[:\.\-–—;]\s+.*\btie.in\s*\z/i, '')
    # 5. Strip publisher-only subtitles after colon/dash: ": A Novel", " - A Thriller"
    t = t.gsub(/\s*[:\-–—]\s+(a |the )?(#{SUBTITLE_GENRE_RE})\s*\z/, '')
    t.gsub(/[^a-z0-9\s]/, '').gsub(/\s+/, ' ').strip
  end

  def self.normalize_author(author)
    return '' if author.blank?
    a = author.to_s.downcase.strip
    # Swap "Last, First" → "First Last"
    if a.match?(/\A[^,]+,\s*[^,]+\z/)
      parts = a.split(',', 2).map(&:strip)
      a = "#{parts[1]} #{parts[0]}"
    end
    a = a.gsub(/\b(dr|mr|mrs|ms|prof|sir)\.?\s+/i, '')
    a.gsub(/[^a-z\s]/, '').gsub(/\s+/, ' ').strip
  end

  def initialize(attrs)
    @google_books_id      = attrs[:google_books_id]
    @isbn                 = attrs[:isbn]
    @hardcover_id         = attrs[:hardcover_id]
    @hardcover_slug       = attrs[:hardcover_slug]
    @ol_work_id           = attrs[:ol_work_id]
    @title                = attrs[:title]
    @author               = attrs[:author]
    @description          = attrs[:description]
    @cover_image_url      = attrs[:cover_image_url]
    @page_count           = attrs[:page_count]
    @first_published_year = attrs[:first_published_year]
  end

  def resolve
    find_existing_work || create_work
  end

  private

  def find_existing_work
    # Step 1: ISBN → edition → work
    if @isbn.present?
      book = Book.find_by(isbn: @isbn)
      return book.work if book&.work_id?
    end

    # Step 2: google_books_id → edition → work
    if @google_books_id.present?
      book = Book.find_by(google_books_id: @google_books_id)
      return book.work if book&.work_id?
    end

    # Step 3: External work IDs (no edition lookup needed)
    if @hardcover_id.present?
      work = Work.find_by(hardcover_id: @hardcover_id)
      return work if work
    end

    if @ol_work_id.present?
      work = Work.find_by(ol_work_id: @ol_work_id)
      return work if work
    end

    # Step 4: Normalized title + author exact match
    nt = self.class.normalize_title(@title)
    na = self.class.normalize_author(@author)
    return nil if nt.blank? || na.blank?

    Work.find_by(normalized_title: nt, normalized_author: na)
  end

  def create_work
    nt = self.class.normalize_title(@title)
    na = self.class.normalize_author(@author)

    # Fall back to raw values if normalization strips everything
    nt = @title.to_s.downcase.strip   if nt.blank?
    na = @author.to_s.downcase.strip  if na.blank?

    # find_or_create_by is safe under concurrent backfill runs
    Work.find_or_create_by!(normalized_title: nt, normalized_author: na) do |w|
      w.canonical_title     = @title
      w.canonical_author    = @author
      w.hardcover_id        = @hardcover_id
      w.hardcover_slug      = @hardcover_slug
      w.ol_work_id          = @ol_work_id
      w.description         = @description
      w.cover_image_url     = @cover_image_url
      w.page_count          = @page_count
      w.first_published_year = @first_published_year
    end
  end
end
