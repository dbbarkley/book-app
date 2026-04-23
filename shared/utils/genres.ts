/**
 * Genre mapping utilities for converting raw API categories (from Google Books, etc.)
 * into the app's internal genre system.
 */

export const GENRE_MAP: Record<string, string[]> = {
  'Romance': ['Romance', 'Contemporary Romance', 'Historical Romance', 'Love Stories'],
  'Fantasy': ['Fantasy', 'Epic Fantasy', 'Magic', 'High Fantasy', 'Urban Fantasy'],
  'Science Fiction': ['Science Fiction', 'Sci-Fi', 'Dystopian', 'Space Opera', 'Cyberpunk'],
  'Mystery & Thriller': ['Mystery', 'Thriller', 'Crime', 'Suspense', 'Detective'],
  'Horror': ['Horror', 'Gothic', 'Occult', 'Supernatural'],
  'Historical Fiction': ['Historical Fiction', 'History Fiction'],
  'Non-Fiction': ['Non-fiction', 'Biography', 'Autobiography', 'Self-Help', 'History', 'Science', 'Business', 'Economics', 'Philosophy', 'Psychology', 'Nature', 'Travel', 'Cooking', 'Art', 'Education', 'Social Science', 'Religion', 'True Crime'],
  'Young Adult (YA)': ['Young Adult', 'YA', 'Juvenile Fiction'],
  'Contemporary': ['Contemporary', 'Contemporary Fiction', 'Literary Fiction'],
  'Classics': ['Classics', 'Classic Literature', 'Antique']
};

/**
 * Maps an array of raw category strings to the app's internal genres.
 * Matches keywords found in the categories against the genre map.
 * 
 * @param categories Array of category strings (e.g., ["Fiction / Fantasy / Epic"])
 * @returns Array of unique mapped genre names
 */
export function mapCategoriesToGenres(categories: string[]): string[] {
  if (!categories || categories.length === 0) return [];

  const mapped: string[] = [];
  
  categories.forEach(cat => {
    const lowerCat = cat.toLowerCase();
    
    Object.entries(GENRE_MAP).forEach(([targetGenre, keywords]) => {
      if (keywords.some(kw => lowerCat.includes(kw.toLowerCase()))) {
        mapped.push(targetGenre);
      }
    });
  });

  // Return unique values
  return Array.from(new Set(mapped));
}

/**
 * Gets a single display genre for a book based on its categories.
 * 
 * @param categories Array of category strings
 * @param fallback Fallback string if no genre matches
 * @returns A single genre name
 */
export function getDisplayGenre(categories: string[] | undefined, fallback: string = 'Fiction'): string {
  if (!categories || categories.length === 0) return fallback;
  
  const mapped = mapCategoriesToGenres(categories);
  if (mapped.length > 0) return mapped[0];
  
  // If no map match, clean up the first raw category
  // e.g. "Fiction / Fantasy / Epic" -> "Fantasy" (if lucky) or just the first part
  const firstCat = categories[0];
  if (firstCat.includes('/')) {
    const parts = firstCat.split('/').map(p => p.trim());
    // Often the second part is the most descriptive (e.g. Fiction / Fantasy)
    return parts.length > 1 ? parts[1] : parts[0];
  }
  
  return firstCat;
}

