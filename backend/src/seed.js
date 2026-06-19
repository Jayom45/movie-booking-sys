import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Booking from './models/Booking.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import User from './models/User.js';

dotenv.config();

const posters = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80'
];

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function seed() {
  await connectDB();
  await Promise.all([Booking.deleteMany({}), Show.deleteMany({}), Movie.deleteMany({}), User.deleteMany({})]);

  await User.create([
    { name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { name: 'Demo User', email: 'user@example.com', password: 'user123', role: 'user' }
  ]);

  const movies = await Movie.create([
    {
      title: 'Midnight Premiere',
      description: 'A suspense thriller about a film crew trapped inside an old cinema during a storm.',
      genre: 'Thriller',
      language: 'English',
      durationMinutes: 124,
      rating: 8.3,
      posterUrl: posters[0],
      releaseDate: new Date('2026-06-01')
    },
    {
      title: 'Chennai Expressway',
      description: 'A breezy action comedy following two strangers on a chaotic intercity road trip.',
      genre: 'Action Comedy',
      language: 'Hindi',
      durationMinutes: 138,
      rating: 7.8,
      posterUrl: posters[1],
      releaseDate: new Date('2026-05-16')
    },
    {
      title: 'Orbit 9',
      description: 'A science fiction adventure about a rescue mission near a failing orbital colony.',
      genre: 'Sci-Fi',
      language: 'English',
      durationMinutes: 132,
      rating: 8.7,
      posterUrl: posters[2],
      releaseDate: new Date('2026-04-25')
    }
  ]);

  await Show.create([
    {
      movie: movies[0]._id,
      theater: 'PVR Phoenix',
      city: 'Mumbai',
      screen: 'Screen 1',
      showTime: hoursFromNow(5),
      price: 280,
      totalSeats: 40,
      bookedSeats: ['A1', 'A2', 'B5']
    },
    {
      movie: movies[0]._id,
      theater: 'INOX Central',
      city: 'Pune',
      screen: 'Screen 3',
      showTime: hoursFromNow(30),
      price: 240,
      totalSeats: 40,
      bookedSeats: []
    },
    {
      movie: movies[1]._id,
      theater: 'Cinepolis Marina',
      city: 'Chennai',
      screen: 'Screen 2',
      showTime: hoursFromNow(8),
      price: 220,
      totalSeats: 40,
      bookedSeats: ['C3', 'C4']
    },
    {
      movie: movies[2]._id,
      theater: 'PVR Orion',
      city: 'Bengaluru',
      screen: 'IMAX',
      showTime: hoursFromNow(12),
      price: 360,
      totalSeats: 40,
      bookedSeats: ['D1']
    }
  ]);

  console.log('Seed complete');
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
