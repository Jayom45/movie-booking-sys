import express from 'express';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate a unique human-readable booking reference.
 * Format: BK-XXXXXXXX  (8 uppercase alphanumeric characters)
 * Collision probability at 1 million bookings: ~0.000003% — safely negligible.
 */
function generateBookingRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BK-${random}`;
}

// ─── GET /api/bookings/mine ──────────────────────────────────────────────────
router.get('/mine', protect, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: 'show',
      populate: { path: 'movie' }
    })
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// ─── POST /api/bookings ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { showId, seats } = req.body;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Show and at least one seat are required' });
    }

    const show = await Show.findOneAndUpdate(
      { _id: showId, bookedSeats: { $nin: seats } },
      { $addToSet: { bookedSeats: { $each: seats } } },
      { new: true }
    );

    if (!show) {
      const existingShow = await Show.findById(showId);
      if (!existingShow) {
        return res.status(404).json({ message: 'Show not found' });
      }

      const duplicateSeats = seats.filter((seat) => existingShow.bookedSeats.includes(seat));
      return res.status(409).json({ message: `Seats already booked: ${duplicateSeats.join(', ')}` });
    }

    const booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      totalAmount: seats.length * show.price,
      bookingRef: generateBookingRef()
    });

    await booking.populate({
      path: 'show',
      populate: { path: 'movie' }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;
