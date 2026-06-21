import express from 'express';
import Show from '../models/Show.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

function buildShowFilter(query) {
  const filter = {};
  if (query.movie) filter.movie = query.movie;
  if (query.city) filter.city = new RegExp(query.city, 'i');
  if (query.date) {
    const start = new Date(`${query.date}T00:00:00.000`);
    const end = new Date(`${query.date}T23:59:59.999`);
    filter.showTime = { $gte: start, $lte: end };
  }
  return filter;
}

// ─── GET /api/shows/meta/cities  (public) ─────────────────────────────────────
router.get('/meta/cities', async (req, res) => {
  const cities = await Show.distinct('city', { showTime: { $gte: new Date() } });
  res.json(cities.sort());
});

// ─── GET /api/shows/admin/all  (admin — all shows, no time filter) ─────────────
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const shows = await Show.find({}).populate('movie', 'title').sort({ showTime: -1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/shows  (public) ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const filter = buildShowFilter(req.query);

  const shows = await Show.find(filter).populate('movie').sort({ showTime: 1 });
  res.json(shows);
});

// ─── GET /api/shows/:id  (public) ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const show = await Show.findById(req.params.id).populate('movie');

  if (!show) {
    return res.status(404).json({ message: 'Show not found' });
  }

  res.json(show);
});

// ─── POST /api/shows  (admin) ─────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  const { movie, theater, city, screen, showTime, pricePremium, priceGold, priceSilver, totalSeats } = req.body;
  const show = await Show.create({
    movie, theater, city, screen, showTime, totalSeats,
    prices: {
      premium: pricePremium || 350,
      gold: priceGold || 250,
      silver: priceSilver || 180
    }
  });
  await show.populate('movie');
  res.status(201).json(show);
});

// ─── PUT /api/shows/:id  (admin — edit show) ──────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { theater, city, screen, showTime, pricePremium, priceGold, priceSilver, totalSeats } = req.body;
    const show = await Show.findByIdAndUpdate(
      req.params.id,
      { 
        theater, city, screen, showTime, totalSeats,
        prices: {
          premium: pricePremium || 350,
          gold: priceGold || 250,
          silver: priceSilver || 180
        }
      },
      { new: true, runValidators: true }
    ).populate('movie', 'title');

    if (!show) return res.status(404).json({ message: 'Show not found' });

    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/shows/:id  (admin — hard-delete show) ────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: 'Show not found' });
    res.json({ message: 'Show deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
