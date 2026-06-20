export const ALLOWED_GENRES = [
  'Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
  'Romance', 'Science Fiction', 'Sports', 'Thriller'
];

export function getValidGenres(genreData) {
  if (!genreData) return [];
  let items = [];
  if (Array.isArray(genreData)) {
    items = genreData;
  } else if (typeof genreData === 'string') {
    items = genreData.split(',').map(s => s.trim());
  }
  return items.filter(g => ALLOWED_GENRES.includes(g));
}
