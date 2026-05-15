# db/seeds/bisac_subcategories.rb
#
# Subcategories for each of the 14 top-level BISAC genres.
# All slugs verified against https://hardcover.app/browse/tags/genre/ on 2026-05-01.
# Book counts shown are from the genre browser (unfiltered).
#
# active: false = slug needs further verification or data is too thin to show.
# Slugs with UUIDs must use the full string exactly.

subcategories = [

  # ── Fiction (FIC000000) — 231,760 books ─────────────────────────────────────
  {
    code: 'FIC019000', name: 'Literary Fiction',      parent_code: 'FIC000000',
    color: '#6366F1', query_terms: ['literary fiction'],
    data_source: 'hardcover', source_identifier: 'literary-fiction', # 410 books
    display_order: 101, active: true,
  },
  {
    code: 'FIC005000', name: 'Contemporary Fiction',  parent_code: 'FIC000000',
    color: '#818CF8', query_terms: ['contemporary fiction'],
    data_source: 'hardcover', source_identifier: 'contemporary-5aa3bf50-fe7e-496f-835d-8659c4fe219b', # 1,180 books
    display_order: 102, active: true,
  },
  {
    code: 'FIC041000', name: 'Magical Realism',        parent_code: 'FIC000000',
    color: '#34D399', query_terms: ['magical realism'],
    data_source: 'hardcover', source_identifier: 'magical-realism', # 226 books
    display_order: 103, active: true,
  },
  {
    code: 'FIC030000', name: 'Short Stories',          parent_code: 'FIC000000',
    color: '#A5B4FC', query_terms: ['short stories'],
    data_source: 'hardcover', source_identifier: 'short-stories',   # 3,925 books
    display_order: 104, active: true,
  },
  {
    code: 'FIC028080', name: 'Climate Fiction',        parent_code: 'FIC000000',
    color: '#6EE7B7', query_terms: ['climate fiction', 'cli-fi'],
    data_source: 'hardcover', source_identifier: 'climate-fiction',
    display_order: 105, active: false, # unverified slug — re-run bisac:probe SLUG=climate-fiction
  },

  # ── Non-Fiction (NON000000) ──────────────────────────────────────────────────
  {
    code: 'HIS000000', name: 'History',                parent_code: 'NON000000',
    color: '#0E7490', query_terms: ['history'],
    data_source: 'hardcover', source_identifier: 'history',          # 63,060 books
    display_order: 201, active: true,
  },
  {
    code: 'SCI000000', name: 'Science',                parent_code: 'NON000000',
    color: '#06B6D4', query_terms: ['science'],
    data_source: 'hardcover', source_identifier: 'science',          # 10,792 books
    display_order: 202, active: true,
  },
  {
    code: 'POL000000', name: 'Politics & Society',     parent_code: 'NON000000',
    color: '#155E75', query_terms: ['politics'],
    data_source: 'hardcover', source_identifier: 'politics',         # 7,590 books
    display_order: 203, active: true,
  },
  {
    code: 'PHI000000', name: 'Philosophy',             parent_code: 'NON000000',
    color: '#1E3A5F', query_terms: ['philosophy'],
    data_source: 'hardcover', source_identifier: 'philosophy',       # 13,431 books
    display_order: 204, active: true,
  },
  {
    code: 'PSY000000', name: 'Psychology',             parent_code: 'NON000000',
    color: '#164E63', query_terms: ['psychology'],
    data_source: 'hardcover', source_identifier: 'psychology',       # 8,616 books
    display_order: 205, active: true,
  },

  # ── Mystery & Thriller (FIC022000) — 23,366 books ───────────────────────────
  {
    code: 'FIC031000', name: 'Suspense',               parent_code: 'FIC022000',
    color: '#1E293B', query_terms: ['suspense'],
    data_source: 'hardcover', source_identifier: 'suspense',         # 8,241 books
    display_order: 301, active: true,
  },
  {
    code: 'FIC025000', name: 'Psychological Thriller', parent_code: 'FIC022000',
    color: '#334155', query_terms: ['psychological thriller'],
    data_source: 'hardcover', source_identifier: 'psychological-thriller', # 82 books
    display_order: 302, active: true,
  },
  {
    code: 'FIC022010', name: 'Cozy Mystery',           parent_code: 'FIC022000',
    color: '#64748B', query_terms: ['cozy mystery'],
    data_source: 'hardcover', source_identifier: 'cozy-mystery',     # 25 books
    display_order: 303, active: true,
  },
  {
    code: 'FIC022060', name: 'Crime',                  parent_code: 'FIC022000',
    color: '#0F172A', query_terms: ['crime'],
    data_source: 'hardcover', source_identifier: 'crime',
    display_order: 304, active: false, # not in genre tag system — user-tag slug
  },
  {
    code: 'FIC031010', name: 'Murder',                 parent_code: 'FIC022000',
    color: '#292524', query_terms: ['murder'],
    data_source: 'hardcover', source_identifier: 'murder',
    display_order: 305, active: false, # not in genre tag system — user-tag slug
  },
  {
    code: 'FIC031020', name: 'Espionage',              parent_code: 'FIC022000',
    color: '#44403C', query_terms: ['espionage', 'spy'],
    data_source: 'hardcover',
    source_identifier: 'espionage-2ffba117-a542-4160-a7b8-200d73ca14da', # 305 books
    display_order: 306, active: true,
  },

  # ── Romance (FIC027000) — 44,043 books ──────────────────────────────────────
  {
    code: 'FIC027070', name: 'Romantasy',              parent_code: 'FIC027000',
    color: '#F472B6', query_terms: ['romantasy'],
    data_source: 'hardcover', source_identifier: 'romantasy',        # 387 books ✓ verified
    display_order: 401, active: true,
  },
  {
    code: 'FIC027010', name: 'Contemporary Romance',   parent_code: 'FIC027000',
    color: '#EC4899', query_terms: ['contemporary romance'],
    data_source: 'hardcover', source_identifier: 'contemporary-romance', # 552 books
    display_order: 402, active: true,
  },
  {
    code: 'FIC027100', name: 'Dark Romance',           parent_code: 'FIC027000',
    color: '#9D174D', query_terms: ['dark romance'],
    data_source: 'hardcover', source_identifier: 'dark-romance',     # 366 books
    display_order: 403, active: true,
  },
  {
    code: 'FIC027050', name: 'Historical Romance',     parent_code: 'FIC027000',
    color: '#BE185D', query_terms: ['historical romance'],
    data_source: 'hardcover', source_identifier: 'historical-romance', # 414 books
    display_order: 404, active: true,
  },
  {
    code: 'FIC027080', name: 'Paranormal Romance',     parent_code: 'FIC027000',
    color: '#7E22CE', query_terms: ['paranormal romance'],
    data_source: 'hardcover', source_identifier: 'paranormal-romance', # 340 books
    display_order: 405, active: true,
  },
  {
    code: 'FIC027090', name: 'Romantic Comedy',        parent_code: 'FIC027000',
    color: '#F9A8D4', query_terms: ['romantic comedy'],
    data_source: 'hardcover', source_identifier: 'romantic-comedy',  # 163 books
    display_order: 406, active: true,
  },
  {
    code: 'FIC027110', name: 'Sports Romance',         parent_code: 'FIC027000',
    color: '#DB2777', query_terms: ['sports romance'],
    data_source: 'hardcover', source_identifier: 'sports-romance',   # 29 books
    display_order: 407, active: true,
  },
  {
    code: 'FIC027120', name: 'Monster Romance',        parent_code: 'FIC027000',
    color: '#6B21A8', query_terms: ['monster romance'],
    data_source: 'hardcover', source_identifier: 'monster-romance',  # 214 books — trending on BookTok
    display_order: 408, active: true,
  },

  # ── Fantasy (FIC009000) — 220,959 books ─────────────────────────────────────
  # No single "fantasy" sub-tag — users tag with specific subtypes.
  # Romantasy appears here AND under Romance (same slug, two discovery paths).
  {
    code: 'FIC009100', name: 'Epic Fantasy',           parent_code: 'FIC009000',
    color: '#8B5CF6', query_terms: ['epic fantasy'],
    data_source: 'hardcover', source_identifier: 'epic-fantasy',     # 80 books
    display_order: 501, active: true,
  },
  {
    code: 'FIC009050', name: 'Romantasy',              parent_code: 'FIC009000',
    color: '#F472B6', query_terms: ['romantasy'],
    data_source: 'hardcover', source_identifier: 'romantasy',        # 387 books
    display_order: 502, active: true,
  },
  {
    code: 'FIC009010', name: 'Urban Fantasy',          parent_code: 'FIC009000',
    color: '#6D28D9', query_terms: ['urban fantasy'],
    data_source: 'hardcover', source_identifier: 'urban-fantasy',    # 1,050 books
    display_order: 503, active: true,
  },
  {
    code: 'FIC009060', name: 'Paranormal',             parent_code: 'FIC009000',
    color: '#4C1D95', query_terms: ['paranormal'],
    data_source: 'hardcover', source_identifier: 'paranormal',       # 561 books
    display_order: 504, active: true,
  },
  {
    code: 'FIC011000', name: 'Fairy Tales & Mythology', parent_code: 'FIC009000',
    color: '#A78BFA', query_terms: ['fairy tales', 'mythology'],
    data_source: 'hardcover', source_identifier: 'fairy-tales',      # 1,757 books
    display_order: 505, active: true,
  },
  {
    code: 'FIC009040', name: 'Dark Academia',          parent_code: 'FIC009000',
    color: '#5B21B6', query_terms: ['dark academia'],
    data_source: 'hardcover', source_identifier: 'dark-academia',    # 22 books
    display_order: 506, active: true,
  },
  {
    code: 'FIC009070', name: 'Dark Fantasy',           parent_code: 'FIC009000',
    color: '#3B0764', query_terms: ['dark fantasy'],
    data_source: 'hardcover', source_identifier: 'dark-fantasy',     # 163 books
    display_order: 507, active: true,
  },
  {
    code: 'FIC009020', name: 'Cozy Fantasy',           parent_code: 'FIC009000',
    color: '#C4B5FD', query_terms: ['cozy fantasy'],
    data_source: 'hardcover', source_identifier: 'cozy-fantasy',     # 4 books — thin but growing
    display_order: 508, active: true,
  },

  # ── Science Fiction (FIC028000) — 100,770 books ──────────────────────────────
  {
    code: 'FIC028060', name: 'Dystopian',              parent_code: 'FIC028000',
    color: '#0369A1', query_terms: ['dystopian'],
    data_source: 'hardcover', source_identifier: 'dystopian',        # 22,771 books
    display_order: 601, active: true,
  },
  {
    code: 'FIC028040', name: 'Aliens',                 parent_code: 'FIC028000',
    color: '#075985', query_terms: ['aliens', 'extraterrestrial'],
    data_source: 'hardcover', source_identifier: 'aliens',           # 14,915 books
    display_order: 602, active: true,
  },
  {
    code: 'FIC028050', name: 'Space',                  parent_code: 'FIC028000',
    color: '#0C4A6E', query_terms: ['space'],
    data_source: 'hardcover', source_identifier: 'space',            # 13,684 books
    display_order: 603, active: true,
  },
  {
    code: 'FIC028030', name: 'Space Opera',            parent_code: 'FIC028000',
    color: '#38BDF8', query_terms: ['space opera'],
    data_source: 'hardcover', source_identifier: 'space-opera',      # 347 books
    display_order: 604, active: true,
  },
  {
    code: 'FIC028020', name: 'Cyberpunk',              parent_code: 'FIC028000',
    color: '#7C3AED', query_terms: ['cyberpunk'],
    data_source: 'hardcover', source_identifier: 'cyberpunk',        # 150 books
    display_order: 605, active: true,
  },
  {
    code: 'FIC032000', name: 'Artificial Intelligence', parent_code: 'FIC028000',
    color: '#1D4ED8', query_terms: ['artificial intelligence', 'ai'],
    data_source: 'hardcover', source_identifier: 'artificial-intelligence', # 174 books
    display_order: 606, active: true,
  },
  {
    code: 'FIC028090', name: 'Time Travel',            parent_code: 'FIC028000',
    color: '#2563EB',  query_terms: ['time travel'],
    data_source: 'hardcover',
    source_identifier: 'time-travel-8fa5a0da-559a-4c88-9c07-55f3168399db', # 250 books
    display_order: 607, active: true,
  },

  # ── Historical Fiction (FIC014000) — 3,159 books ─────────────────────────────
  {
    code: 'FIC014010', name: 'WWII Fiction',           parent_code: 'FIC014000',
    color: '#78350F', query_terms: ['world war ii', 'wwii'],
    data_source: 'hardcover', source_identifier: 'world-war-ii',     # 16 books (verify with MIN=5)
    display_order: 701, active: true,
  },
  {
    code: 'FIC014020', name: 'Regency',                parent_code: 'FIC014000',
    color: '#D97706', query_terms: ['regency'],
    data_source: 'hardcover', source_identifier: 'regency',          # 7 books
    display_order: 702, active: true,
  },
  {
    code: 'FIC014040', name: 'Medieval',               parent_code: 'FIC014000',
    color: '#92400E', query_terms: ['medieval'],
    data_source: 'hardcover', source_identifier: 'medieval',         # 14 books
    display_order: 703, active: true,
  },
  {
    code: 'FIC014030', name: 'Ancient World',          parent_code: 'FIC014000',
    color: '#B45309', query_terms: ['ancient history', 'ancient world'],
    data_source: 'hardcover', source_identifier: 'ancient-history',  # 3 books
    display_order: 704, active: true,
  },
  {
    code: 'FIC014050', name: 'Victorian',              parent_code: 'FIC014000',
    color: '#A16207', query_terms: ['victorian'],
    data_source: 'hardcover', source_identifier: 'victorian',        # 11 books
    display_order: 705, active: true,
  },
  {
    code: 'FIC014060', name: 'War',                    parent_code: 'FIC014000',
    color: '#713F12', query_terms: ['war', 'military fiction'],
    data_source: 'hardcover', source_identifier: 'war',              # 40,426 books — huge
    display_order: 706, active: true,
  },

  # ── Horror (FIC015000) — 1,943 books ─────────────────────────────────────────
  {
    code: 'FIC066000', name: 'Gothic',                 parent_code: 'FIC015000',
    color: '#B91C1C', query_terms: ['gothic'],
    data_source: 'hardcover', source_identifier: 'gothic',           # 56 books ✓
    display_order: 801, active: true,
  },
  {
    code: 'FIC024000', name: 'Occult & Supernatural',  parent_code: 'FIC015000',
    color: '#7F1D1D', query_terms: ['occult', 'supernatural'],
    data_source: 'hardcover',
    source_identifier: 'occult-aa0cfa69-77bc-4cce-9536-c8c1264b2811', # 368 books ✓
    display_order: 802, active: true,
  },
  {
    code: 'FIC015020', name: 'Psychological Horror',   parent_code: 'FIC015000',
    color: '#450A0A', query_terms: ['psychological horror'],
    data_source: 'hardcover', source_identifier: 'psychological-horror', # 25 books ✓
    display_order: 803, active: true,
  },
  {
    code: 'FIC015030', name: 'Cosmic Horror',          parent_code: 'FIC015000',
    color: '#1C1917', query_terms: ['cosmic horror', 'lovecraftian'],
    data_source: 'hardcover', source_identifier: 'cosmic-horror',    # 14 books ✓
    display_order: 804, active: true,
  },
  {
    code: 'FIC015040', name: 'Ghost Stories',          parent_code: 'FIC015000',
    color: '#44403C', query_terms: ['ghost stories'],
    data_source: 'hardcover', source_identifier: 'ghost-stories',
    display_order: 805, active: false, # slug not found in genre tag system — likely a user-tag slug; probe with bisac:probe SLUG=ghost-story
  },

  # ── Biography & Memoir (BIO000000) — 24,530 books ───────────────────────────
  # NOTE: memoir, autobiography, sports-recreation, music all return 0 via the genre-tag
  # filter (taggings → tag → slug). These slugs appear in Hardcover's user-tag browser,
  # not the curated genre browser. Disabled until a genre-system equivalent is found.
  # The parent 'biography' shelf covers the full pool adequately.
  {
    code: 'BIO026000', name: 'Memoir',                 parent_code: 'BIO000000',
    color: '#10B981', query_terms: ['memoir'],
    data_source: 'hardcover', source_identifier: 'memoir',
    display_order: 901, active: false, # not in genre tag system
  },
  {
    code: 'BIO001000', name: 'Autobiography',          parent_code: 'BIO000000',
    color: '#059669', query_terms: ['autobiography'],
    data_source: 'hardcover', source_identifier: 'autobiography',
    display_order: 902, active: false, # not in genre tag system
  },
  {
    code: 'BIO018000', name: 'Sports Biography',       parent_code: 'BIO000000',
    color: '#047857', query_terms: ['sports biography'],
    data_source: 'hardcover', source_identifier: 'sports-recreation',
    display_order: 903, active: false, # not in genre tag system
  },
  {
    code: 'BIO005000', name: 'Music & Arts',           parent_code: 'BIO000000',
    color: '#065F46', query_terms: ['music biography'],
    data_source: 'hardcover', source_identifier: 'music',
    display_order: 904, active: false, # not in genre tag system
  },

  # ── Self-Help (SEL000000) — 4,146 books ─────────────────────────────────────
  # NOTE: All subcategory slugs below return 0 via the genre-tag filter. These slugs
  # (psychology, mental-health, productivity, mind-spirit, health-fitness,
  # family-relationships) exist in Hardcover's user-tag browser, NOT the curated genre
  # browser. The parent self-help shelf covers the full pool adequately.
  {
    code: 'PSY001000', name: 'Psychology',             parent_code: 'SEL000000',
    color: '#F59E0B', query_terms: ['psychology'],
    data_source: 'hardcover', source_identifier: 'psychology',
    display_order: 1001, active: false, # not in genre tag system
  },
  {
    code: 'SEL010000', name: 'Mental Health',          parent_code: 'SEL000000',
    color: '#FCD34D', query_terms: ['mental health'],
    data_source: 'hardcover', source_identifier: 'mental-health',
    display_order: 1002, active: false, # not in genre tag system
  },
  {
    code: 'SEL017000', name: 'Productivity',           parent_code: 'SEL000000',
    color: '#D97706', query_terms: ['productivity'],
    data_source: 'hardcover', source_identifier: 'productivity',
    display_order: 1003, active: false, # not in genre tag system
  },
  {
    code: 'SEL028000', name: 'Mind & Spirit',          parent_code: 'SEL000000',
    color: '#92400E', query_terms: ['mind spirit', 'spirituality'],
    data_source: 'hardcover', source_identifier: 'mind-spirit',
    display_order: 1004, active: false, # not in genre tag system
  },
  {
    code: 'SEL032000', name: 'Health & Fitness',       parent_code: 'SEL000000',
    color: '#B45309', query_terms: ['health fitness'],
    data_source: 'hardcover', source_identifier: 'health-fitness',
    display_order: 1005, active: false, # not in genre tag system
  },
  {
    code: 'SEL023000', name: 'Family & Relationships', parent_code: 'SEL000000',
    color: '#FBBF24', query_terms: ['family relationships'],
    data_source: 'hardcover', source_identifier: 'family-relationships',
    display_order: 1006, active: false, # not in genre tag system
  },

  # ── True Crime (TRU000000) — 1,369 books ────────────────────────────────────
  # NOTE: murder, crime, cults all return 0 — user-tag slugs, not genre tag slugs.
  # serial-killers IS a genre slug (7 books ✓) but too thin to show a useful shelf.
  # True Crime is well-served by its parent shelf alone.
  {
    code: 'TRU000020', name: 'Murder',                 parent_code: 'TRU000000',
    color: '#374151', query_terms: ['murder'],
    data_source: 'hardcover', source_identifier: 'murder',
    display_order: 1101, active: false, # not in genre tag system
  },
  {
    code: 'TRU000030', name: 'Crime',                  parent_code: 'TRU000000',
    color: '#1F2937', query_terms: ['crime'],
    data_source: 'hardcover', source_identifier: 'crime',
    display_order: 1102, active: false, # not in genre tag system
  },
  {
    code: 'TRU000010', name: 'Cults',                  parent_code: 'TRU000000',
    color: '#4B5563', query_terms: ['cults'],
    data_source: 'hardcover', source_identifier: 'cults',
    display_order: 1103, active: false, # not in genre tag system
  },
  {
    code: 'TRU000040', name: 'Serial Killers',         parent_code: 'TRU000000',
    color: '#6B7280', query_terms: ['serial killers'],
    data_source: 'hardcover', source_identifier: 'serial-killers',   # 7 books — thin
    display_order: 1104, active: false, # too thin to show a useful shelf
  },

  # ── Young Adult (YAF000000) — 148,443 books ──────────────────────────────────
  {
    code: 'YAF019000', name: 'YA Fantasy',             parent_code: 'YAF000000',
    color: '#34D399', query_terms: ['young adult fantasy'],
    data_source: 'hardcover', source_identifier: 'young-adult-fantasy', # 26 books
    display_order: 1201, active: true,
  },
  {
    code: 'YAF001000', name: 'YA Fiction',             parent_code: 'YAF000000',
    color: '#6EE7B7', query_terms: ['young adult fiction'],
    data_source: 'hardcover', source_identifier: 'young-adult-fiction', # 12,191 books
    display_order: 1202, active: true,
  },
  {
    code: 'YAF002000', name: 'Coming of Age',          parent_code: 'YAF000000',
    color: '#10B981', query_terms: ['coming of age'],
    data_source: 'hardcover',
    source_identifier: 'coming-of-age-7a8c5a5e-b98b-4589-bc26-4be18a640ecd', # 177 books
    display_order: 1203, active: true,
  },
  {
    code: 'YAF003000', name: 'Middle Grade',           parent_code: 'YAF000000',
    color: '#A7F3D0', query_terms: ['middle grade'],
    data_source: 'hardcover', source_identifier: 'middle-grade',     # 422 books
    display_order: 1204, active: true,
  },
  {
    code: 'YAF052000', name: 'YA Romance',             parent_code: 'YAF000000',
    color: '#059669', query_terms: ['young adult romance'],
    data_source: 'hardcover', source_identifier: 'young-adult-romance',
    display_order: 1205, active: true, # re-verify with bisac:probe SLUG=young-adult-romance
  },

  # ── Business (BUS000000) — 13,610 books ─────────────────────────────────────
  {
    code: 'BUS025000', name: 'Entrepreneurship',       parent_code: 'BUS000000',
    color: '#3B82F6', query_terms: ['entrepreneurship'],
    data_source: 'hardcover', source_identifier: 'entrepreneurship', # 13 books — thin
    display_order: 1301, active: true,
  },
  {
    code: 'BUS071000', name: 'Leadership',             parent_code: 'BUS000000',
    color: '#2563EB', query_terms: ['leadership'],
    data_source: 'hardcover', source_identifier: 'leadership',       # 7 books — thin
    display_order: 1302, active: true,
  },
  {
    code: 'BUS050000', name: 'Finance',                parent_code: 'BUS000000',
    color: '#1D4ED8', query_terms: ['finance'],
    data_source: 'hardcover', source_identifier: 'finance',          # 1,298 books ✓
    display_order: 1303, active: true,
  },
  {
    code: 'BUS023000', name: 'Economics',              parent_code: 'BUS000000',
    color: '#1E40AF', query_terms: ['economics'],
    data_source: 'hardcover', source_identifier: 'economics',        # 202 books
    display_order: 1304, active: true,
  },
  {
    code: 'BUS060000', name: 'Programming',            parent_code: 'BUS000000',
    color: '#1E3A8A', query_terms: ['programming', 'software'],
    data_source: 'hardcover', source_identifier: 'programming',      # 1,000 books ✓
    display_order: 1305, active: true,
  },

  # ── Graphic Novels (CGN000000) — 29,286 books ────────────────────────────────
  {
    code: 'CGN004050', name: 'Manga',                  parent_code: 'CGN000000',
    color: '#F97316', query_terms: ['manga'],
    data_source: 'hardcover', source_identifier: 'manga',            # 2,408 books ✓
    display_order: 1401, active: true,
  },
  {
    code: 'CGN004010', name: 'Comics',                 parent_code: 'CGN000000',
    color: '#DC2626', query_terms: ['comics'],
    data_source: 'hardcover', source_identifier: 'comics',           # 76,095 books
    display_order: 1402, active: true,
  },
  {
    code: 'CGN004070', name: 'Graphic Memoir',         parent_code: 'CGN000000',
    color: '#EA580C', query_terms: ['graphic memoir'],
    data_source: 'hardcover', source_identifier: 'graphic-memoir',   # 3 books — thin
    display_order: 1403, active: true,
  },
  {
    code: 'CGN004020', name: "Boy's Love",             parent_code: 'CGN000000',
    color: '#C2410C', query_terms: ["boy's love", 'bl', 'yaoi'],
    data_source: 'hardcover',
    source_identifier: 'boys-love-b8a8ac9b-f5e2-4655-acc9-d7963ea4f217', # 623 books
    display_order: 1404, active: true,
  },
]

now = Time.current

subcategories.each do |attrs|
  BisacCategory.upsert(
    attrs.merge(
      stale_hours: 168,
      created_at:  now,
      updated_at:  now,
    ),
    unique_by: :code,
    update_only: %i[
      name parent_code color query_terms data_source source_identifier
      stale_hours display_order active
    ]
  )
end

active_count   = subcategories.count { |c| c.fetch(:active, true) }
inactive_count = subcategories.size - active_count
puts "Seeded #{subcategories.size} BISAC subcategories (#{active_count} active, #{inactive_count} disabled)."
