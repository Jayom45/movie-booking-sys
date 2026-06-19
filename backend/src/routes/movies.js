import express from 'express';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = { isActive: true };
  const search = req.query.search?.trim();

  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { genre: new RegExp(search, 'i') },
      { language: new RegExp(search, 'i') }
    ];
  }

  const movies = await Movie.find(query).sort({ releaseDate: -1 });
  res.json(movies);
});

router.get('/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie || !movie.isActive) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  const shows = await Show.find({
    movie: movie._id,
    showTime: { $gte: new Date() }
  }).sort({ showTime: 1 });

  res.json({ movie, shows });
});

router.post('/', protect, adminOnly, async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  res.json(movie);
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  res.json({ message: 'Movie hidden from listings' });
});

export default router;
