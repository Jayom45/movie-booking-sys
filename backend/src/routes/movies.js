import express from 'express';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { errorStatus } from '../utils/errorStatus.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const router = express.Router();

// ─── GET /api/movies  (public — only active) ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const query = { isActive: true };
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { title: pattern },
        { genre: pattern },
        { language: pattern }
      ];
    }

    const movies = await Movie.find(query).sort({ releaseDate: -1 });
    res.json(movies);
  } catch (error) {
    res.status(errorStatus(error)).json({ message: error.message });
  }
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
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const shows = await Show.find({
      movie: movie._id,
      showTime: { $gte: new Date() }
    }).sort({ showTime: 1 });

    res.json({ movie, shows });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/movies  (admin) ────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (error) {
    res.status(errorStatus(error)).json({ message: error.message });
  }
});

// ─── PUT /api/movies/:id  (admin — edit) ─────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    res.status(errorStatus(error)).json({ message: error.message });
  }
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
    res.status(errorStatus(error)).json({ message: error.message });
  }
});

// ─── DELETE /api/movies/:id  (admin — soft-delete / set inactive) ─────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie hidden from listings' });
  } catch (error) {
    res.status(errorStatus(error)).json({ message: error.message });
  }
});

export default router;
