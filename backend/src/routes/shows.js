import express from 'express';
import Show from '../models/Show.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.movie) filter.movie = req.query.movie;
  if (req.query.city) filter.city = new RegExp(req.query.city, 'i');

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
