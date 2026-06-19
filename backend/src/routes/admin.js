import express from 'express';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats — summary counts for the admin overview cards
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [movies, shows, users, bookings] = await Promise.all([
      Movie.countDocuments({}),
      Show.countDocuments({}),
      User.countDocuments({}),
      Booking.countDocuments({})
    ]);
    res.json({ movies, shows, users, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
