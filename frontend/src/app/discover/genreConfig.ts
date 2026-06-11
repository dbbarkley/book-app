export interface SubCategory {
  name:       string
  bisacCode?: string
}

export interface GenreConfig {
  name:          string
  slug:          string
  query:         string          // search query string (fallback only)
  bisacCode:     string          // BISAC code for curated shelf endpoint
  color:         string          // card background color
  textColor:     '#FAF6EB' | '#1A1A1A'
  label:         string          // short descriptor on discover grid cards
  quote:         string          // editorial tagline for the genre hero
  subcategories: SubCategory[]
}

export const GENRES: GenreConfig[] = [
  {
    name: 'Literary Fiction', slug: 'literary-fiction', query: 'literary fiction', bisacCode: 'FIC019000',
    color: '#D5582E', textColor: '#FAF6EB',
    label: 'Timeless & challenging',
    quote: 'Language that unsettles. Fiction that stays.',
    subcategories: [
      { name: 'Contemporary',    bisacCode: 'FIC005000' },
      { name: 'Magical Realism', bisacCode: 'FIC041000' },
      { name: 'Short Stories',   bisacCode: 'FIC030000' },
      { name: 'Translated' },
      { name: 'Experimental' },
      { name: 'Classics' },
    ],
  },
  {
    name: 'Mystery & Thriller', slug: 'mystery-thriller', query: 'mystery thriller', bisacCode: 'FIC022000',
    color: '#234A5A', textColor: '#FAF6EB',
    label: 'Keep you guessing',
    quote: 'The answer exists. You just can\'t find it yet.',
    subcategories: [
      { name: 'Crime' },
      { name: 'Psychological',  bisacCode: 'FIC025000' },
      { name: 'Cozy Mystery',   bisacCode: 'FIC022010' },
      { name: 'Nordic Noir' },
      { name: 'Legal Thriller' },
      { name: 'Suspense',       bisacCode: 'FIC031000' },
    ],
  },
  {
    name: 'Science Fiction', slug: 'science-fiction', query: 'science fiction', bisacCode: 'FIC028000',
    color: '#2D5BA5', textColor: '#FAF6EB',
    label: 'Worlds beyond our own',
    quote: 'What if? Taken seriously.',
    subcategories: [
      { name: 'Space Opera',   bisacCode: 'FIC028030' },
      { name: 'Dystopian',     bisacCode: 'FIC028060' },
      { name: 'Hard SF' },
      { name: 'Cyberpunk',     bisacCode: 'FIC028020' },
      { name: 'First Contact' },
      { name: 'Time Travel',   bisacCode: 'FIC028090' },
    ],
  },
  {
    name: 'Fantasy', slug: 'fantasy', query: 'fantasy', bisacCode: 'FIC009000',
    color: '#6B3A7D', textColor: '#FAF6EB',
    label: 'Magic & wonder',
    quote: 'The rules are different here. That\'s the point.',
    subcategories: [
      { name: 'Epic Fantasy',   bisacCode: 'FIC009100' },
      { name: 'Urban Fantasy',  bisacCode: 'FIC009010' },
      { name: 'Romantasy',      bisacCode: 'FIC009050' },
      { name: 'Dark Fantasy',   bisacCode: 'FIC009070' },
      { name: 'Fairy Tales',    bisacCode: 'FIC011000' },
      { name: 'Portal Fantasy' },
    ],
  },
  {
    name: 'Romance', slug: 'romance', query: 'romance', bisacCode: 'FIC027000',
    color: '#C94B7A', textColor: '#FAF6EB',
    label: 'Love in all its forms',
    quote: 'Yearning. Slow burns. The good ones earn it.',
    subcategories: [
      { name: 'Romantasy',     bisacCode: 'FIC027070' },
      { name: 'Contemporary',  bisacCode: 'FIC027010' },
      { name: 'Historical',    bisacCode: 'FIC027050' },
      { name: 'Queer romance' },
      { name: 'Rom-com',       bisacCode: 'FIC027090' },
      { name: 'Gothic & dark', bisacCode: 'FIC027100' },
    ],
  },
  {
    name: 'Historical Fiction', slug: 'historical-fiction', query: 'historical fiction', bisacCode: 'FIC014000',
    color: '#5C4033', textColor: '#FAF6EB',
    label: 'The past, alive again',
    quote: 'The past isn\'t over. It\'s just wearing a costume.',
    subcategories: [
      { name: 'Ancient World', bisacCode: 'FIC014030' },
      { name: 'Medieval',      bisacCode: 'FIC014040' },
      { name: 'Victorian',     bisacCode: 'FIC014050' },
      { name: 'WWII',          bisacCode: 'FIC014010' },
      { name: 'Regency',       bisacCode: 'FIC014020' },
      { name: 'American' },
    ],
  },
  {
    name: 'Biography', slug: 'biography', query: 'biography memoir', bisacCode: 'BIO000000',
    color: '#B8970A', textColor: '#1A1A1A',
    label: 'Real lives, real stories',
    quote: 'Someone lived this. Someone wrote it down.',
    subcategories: [
      { name: 'Memoir' },
      { name: 'Political' },
      { name: 'Artistic' },
      { name: 'Scientific' },
      { name: 'Sports' },
      { name: 'True Crime',  bisacCode: 'TRU000000' },
    ],
  },
  {
    name: 'Horror', slug: 'horror', query: 'horror', bisacCode: 'FIC015000',
    color: '#1A1A1A', textColor: '#FAF6EB',
    label: 'Fear is the point',
    quote: 'The fear is the thing. And you asked for it.',
    subcategories: [
      { name: 'Psychological', bisacCode: 'FIC015020' },
      { name: 'Supernatural',  bisacCode: 'FIC024000' },
      { name: 'Gothic',        bisacCode: 'FIC066000' },
      { name: 'Body Horror' },
      { name: 'Cosmic',        bisacCode: 'FIC015030' },
      { name: 'Cozy Horror' },
    ],
  },
  {
    name: 'Self-Help', slug: 'self-help', query: 'self help', bisacCode: 'SEL000000',
    color: '#F1C75B', textColor: '#1A1A1A',
    label: 'Grow from within',
    quote: 'Incremental shifts. Surprisingly effective.',
    subcategories: [
      { name: 'Productivity' },
      { name: 'Mindfulness' },
      { name: 'Relationships' },
      { name: 'Finance' },
      { name: 'Career' },
      { name: 'Health' },
    ],
  },
  {
    name: 'Young Adult', slug: 'young-adult', query: 'young adult fiction', bisacCode: 'YAF000000',
    color: '#E8704A', textColor: '#FAF6EB',
    label: 'All the big feelings',
    quote: 'All the biggest feelings you ever had.',
    subcategories: [
      { name: 'Fantasy YA',     bisacCode: 'YAF019000' },
      { name: 'Contemporary',   bisacCode: 'YAF001000' },
      { name: 'Sci-Fi YA' },
      { name: 'Horror YA' },
      { name: 'Romance YA',     bisacCode: 'YAF052000' },
      { name: 'Diverse Voices', bisacCode: 'YAF002000' },
    ],
  },
  {
    name: 'Poetry', slug: 'poetry', query: 'poetry', bisacCode: 'POE000000',
    color: '#4A7A5C', textColor: '#FAF6EB',
    label: 'Language at its limit',
    quote: 'The whole world in seventeen syllables.',
    subcategories: [
      { name: 'Contemporary' },
      { name: 'Spoken Word' },
      { name: 'Translated' },
      { name: 'Classic' },
      { name: 'Nature' },
      { name: 'Love' },
    ],
  },
  {
    name: 'Graphic Novels', slug: 'graphic-novels', query: 'graphic novel', bisacCode: 'CGN000000',
    color: '#7A3A5C', textColor: '#FAF6EB',
    label: 'Art meets narrative',
    quote: 'When words need backup. When pictures tell the truth.',
    subcategories: [
      { name: 'Manga',     bisacCode: 'CGN004050' },
      { name: 'Comics',    bisacCode: 'CGN004010' },
      { name: 'Memoir',    bisacCode: 'CGN004070' },
      { name: 'Sci-Fi' },
      { name: 'Fantasy' },
      { name: 'Superhero' },
    ],
  },
]

export function getGenreBySlug(slug: string): GenreConfig | undefined {
  return GENRES.find(g => g.slug === slug)
}

export function getGenreSectionNumber(slug: string): string {
  const idx = GENRES.findIndex(g => g.slug === slug)
  return idx === -1 ? '01' : String(idx + 1).padStart(2, '0')
}
