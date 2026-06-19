import express from 'express';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/movies  (public — only active) ──────────────────────────────────
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

// ─── GET /api/movies/admin/all  (admin — all movies including inactive) ────────
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const movies = await Movie.find({}).sort({ releaseDate: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/movies/:id  (public) ───────────────────────────────────────────
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

// ─── POST /api/movies  (admin) ────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
});

// ─── PUT /api/movies/:id  (admin — edit) ─────────────────────────────────────
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

// ─── PATCH /api/movies/:id/toggle  (admin — toggle isActive) ─────────────────
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    movie.isActive = !movie.isActive;
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/movies/:id  (admin — soft-delete / set inactive) ─────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  res.json({ message: 'Movie hidden from listings' });
});

export default router;
