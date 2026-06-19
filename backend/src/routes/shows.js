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

router.get('/meta/cities', async (req, res) => {
  const cities = await Show.distinct('city', { showTime: { $gte: new Date() } });
  res.json(cities.sort());
});

router.get('/', async (req, res) => {
  const filter = buildShowFilter(req.query);

  const shows = await Show.find(filter).populate('movie').sort({ showTime: 1 });
  res.json(shows);
});

router.get('/:id', async (req, res) => {
  const show = await Show.findById(req.params.id).populate('movie');

  if (!show) {
    return res.status(404).json({ message: 'Show not found' });
  }

  res.json(show);
});

router.post('/', protect, adminOnly, async (req, res) => {
  const show = await Show.create(req.body);
  await show.populate('movie');
  res.status(201).json(show);
});

export default router;
