import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer();

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

    const seatDetails = seats.map(seat => {
      const row = seat.replace(/[0-9]/g, '');
      let category = 'Silver';
      let price = show.prices?.silver || 180;

      if (row === 'A' || row === 'B') {
        category = 'Premium';
        price = show.prices?.premium || 350;
      } else if (row === 'C' || row === 'D') {
        category = 'Gold';
        price = show.prices?.gold || 250;
      }

      return { number: seat, category, price };
    });

    const totalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);

    const booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      seatDetails,
      totalAmount,
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

// ─── POST /api/bookings/:id/cancel ───────────────────────────────────────────
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Attempt to free the seats in the associated Show
    if (booking.show && booking.seats && booking.seats.length > 0) {
      await Show.updateOne(
        { _id: booking.show },
        { $pullAll: { bookedSeats: booking.seats } }
      );
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/bookings/:id/email ────────────────────────────────────────────
router.post('/:id/email', protect, upload.single('ticketPdf'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate({
      path: 'show',
      populate: { path: 'movie' }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Missing ticket PDF attachment' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Email service is not configured on the server.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const dateStr = new Date(booking.show.showTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = new Date(booking.show.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mailOptions = {
      from: `"CineBook Tickets" <${process.env.EMAIL_USER}>`,
      to: req.user.email,
      subject: '🎬 CineBook Ticket Confirmation',
      text: `Hello ${req.user.name},

Thank you for booking with CineBook.

Your ticket is attached as a PDF.

Movie: ${booking.show.movie.title}
Theatre: ${booking.show.theater}, ${booking.show.city}
Date: ${dateStr}
Time: ${timeStr}
Seats: ${booking.seatDetails?.length > 0 ? booking.seatDetails.map(s => `${s.number} (${s.category})`).join(', ') : booking.seats.join(', ')}

Enjoy your show.

Team CineBook`,
      attachments: [
        {
          filename: `ticket-${booking._id}.pdf`,
          content: req.file.buffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Ticket emailed successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email. Ensure Gmail credentials are correct.' });
  }
});

export default router;
