export const GENRE_METADATA: Record<string, { color: string; glyph: string; description: string }> = {
  'Romance': {
    color: '#F472B6',
    glyph: 'The Intersect',
    description: 'Two overlapping curves forming a soft nexus.'
  },
  'Fantasy': {
    color: '#A78BFA',
    glyph: 'The Spark',
    description: 'A 4-pointed diamond star with a hollow center.'
  },
  'Science Fiction': {
    color: '#22D3EE',
    glyph: 'The Pulse',
    description: 'Three parallel horizontal lines of varying lengths.'
  },
  'Mystery & Thriller': {
    color: '#475569',
    glyph: 'The Aperture',
    description: 'A solid circle with a single vertical "sliver" cut out.'
  },
  'Horror': {
    color: '#B91C1C',
    glyph: 'The Shard',
    description: 'An asymmetric, jagged triangle.'
  },
  'Historical Fiction': {
    color: '#B45309',
    glyph: 'The Column',
    description: 'Two thick vertical bars with horizontal caps.'
  },
  'Non-Fiction': {
    color: '#059669',
    glyph: 'The Hex',
    description: 'A perfect hexagon with a central focal point.'
  },
  'Young Adult (YA)': {
    color: '#FBBF24',
    glyph: 'The Flare',
    description: 'A minimalist "lightning" path with three segments.'
  },
  'Contemporary': {
    color: '#3B82F6',
    glyph: 'The Frame',
    description: 'An open-ended square (missing the top-right corner).'
  },
  'Classics': {
    color: '#78350F',
    glyph: 'The Arc',
    description: 'A precise semi-circle atop a thin horizontal base.'
  }
};

export const TIER_NAMES: Record<string, string[]> = {
  'Romance': ['Swoon Seeker', 'First Kiss Connoisseur', 'HEA Addict', 'Trope Titan', 'Romance Royalty'],
  'Fantasy': ['Stable Hand', 'Questing Squire', 'Map Whisperer', 'Dragon Rider', 'High Sorcerer'],
  'Science Fiction': ['Space Cadet', 'Stardust Voyager', 'Neon Navigator', 'Galactic Ambassador', 'Star-Lord'],
  'Mystery & Thriller': ['Amateur Sleuth', 'Red Herring Wrangler', 'Private Eye', 'Forensic Master', 'The Mastermind'],
  'Horror': ['Night-Light Sleeper', 'Sole Survivor', 'Cryptid Hunter', 'Nightmare Connoisseur', 'Harbinger of Doom'],
  'Historical Fiction': ['Time Traveler', 'Period Piece Pro', 'Royal Courtier', 'History Buff', 'The Archivist'],
  'Non-Fiction': ['Fact Finder', 'Knowledge Seeker', 'Life Optimizer', 'Subject Matter Expert', 'The Oracle'],
  'Young Adult (YA)': ['Main Character Energy', 'Rebel Leader', 'Love Triangle Survivor', 'The Chosen One', 'YA Legend'],
  'Contemporary': ['Coffee Shop Regular', 'Slice-of-Life Specialist', 'Drama Magnet', 'Modern Philosopher', 'The Socialite'],
  'Classics': ['Dashing Debutante', 'Victorian Voyager', 'Existentialist', 'Literary Giant', 'The Immortal']
};

export const TIER_QUOTES: Record<string, string[]> = {
  'Romance': [
    "You're just here for the \"there was only one bed\" trope.",
    "You can spot a slow-burn romance from a mile away.",
    "Your standards for real-life dating are now statistically impossible.",
    "You've read every \"enemies to lovers\" arc in existence.",
    "You don't just read love stories; you're the CEO of Valentine's Day."
  ],
  'Fantasy': [
    "You're just starting to realize the protagonist is the \"chosen one.\"",
    "You've survived your first dragon encounter and didn't even lose a limb.",
    "You spend more time looking at the front of the book than the actual text.",
    "You know three different fictional languages and aren't afraid to use them.",
    "You have officially transcended this reality and moved into a castle in the clouds."
  ],
  'Science Fiction': [
    "You just realized the AI is definitely going to turn evil.",
    "You've mastered the art of explaining \"quantum\" things to your friends.",
    "You've read enough dystopia to know exactly how to fix the future.",
    "You've visited more planets than Neil Armstrong, technically.",
    "You are 70% stardust and 30% speculative physics at this point."
  ],
  'Mystery & Thriller': [
    "You think you know who did it. (Spoiler: You're wrong).",
    "You've stopped trusting every character, including the narrator.",
    "You've solved the mystery by chapter three, but you keep reading for the drama.",
    "You can identify a plot twist before the author even writes it.",
    "You are the one who knocks. And the one who solved it."
  ],
  'Horror': [
    "You're reading with one eye closed and all the lights on.",
    "You know better than to check the basement when you hear a noise.",
    "You're starting to find the monsters... actually kind of misunderstood?",
    "You don't flinch at jump scares; you judge the pacing instead.",
    "You've seen things that would make HP Lovecraft take a nap."
  ],
  'Historical Fiction': [
    "You're just here for the fancy dresses and the lack of Wi-Fi.",
    "You know exactly which year that specific type of corset was invented.",
    "You've survived the plague and at least three political assassinations.",
    "You frequently argue with the author about the accuracy of 18th-century plumbing.",
    "You have lived through every century. In your head, at least."
  ],
  'Non-Fiction': [
    "You're just here to win your next family argument with a \"well, actually...\"",
    "Your brain is now 40% trivia and 60% productivity hacks.",
    "You've read so many biographies you're starting to act like Winston Churchill.",
    "You can give a TED Talk on a topic you knew nothing about last Tuesday.",
    "You are a walking encyclopedia, but with better fashion sense."
  ],
  'Young Adult (YA)': [
    "You're just waiting for your invitation to a magic school.",
    "You've successfully overthrown at least one corrupt dystopian government.",
    "You've chosen a side, and you will defend it to the death.",
    "You're 17 years old and somehow responsible for the fate of the world.",
    "You've read so many coming-of-age stories you've aged backward."
  ],
  'Contemporary': [
    "You're here for the relatable drama and the aesthetic.",
    "You enjoy reading about other people's problems instead of your own.",
    "You've survived a messy breakup and a career crisis in under 300 pages.",
    "You've found the meaning of life in a story about a suburban HOA meeting.",
    "You know everyone in the fictional neighborhood, and you have thoughts."
  ],
  'Classics': [
    "You're just here for the Mr. Darcy vibes.",
    "You can handle sentences that are three pages long without blinking.",
    "You've spent forty hours wondering why the curtains were blue.",
    "You've read the books everyone else pretends to have read.",
    "You and Shakespeare are basically on a first-name basis."
  ]
};

