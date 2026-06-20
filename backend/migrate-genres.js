import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ALLOWED_GENRES = [
  'Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 
  'Romance', 'Science Fiction', 'Sports', 'Thriller'
];

const movieSchema = new mongoose.Schema({ genre: mongoose.Schema.Types.Mixed }, { strict: false });
const Movie = mongoose.model('MovieMigration', movieSchema, 'movies');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook');
    console.log('Connected to DB');
    
    const movies = await Movie.find({});
    let migratedCount = 0;
    
    for (const m of movies) {
      if (typeof m.genre === 'string') {
        // Split by comma, trim, and filter only allowed genres
        const parts = m.genre.split(',').map(s => s.trim());
        const validGenres = parts.filter(p => ALLOWED_GENRES.includes(p));
        
        // If it had a genre that wasn't exactly in the allowed list, map it or just keep whatever matches
        // For fallback, if empty, assign 'Drama' as a generic safe bet just so it has something
        m.genre = validGenres.length > 0 ? validGenres : ['Drama'];
        await m.save();
        migratedCount++;
      }
    }
    
    console.log(`Migrated ${migratedCount} movies successfully.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
