import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import nodemailer from 'nodemailer';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import Show from '../models/Show.js';
import Squad from '../models/Squad.js';
import SquadMember from '../models/SquadMember.js';
import { protect } from '../middleware/auth.js';
import { applyCoupon } from '../utils/coupons.js';
import { calculateTotals, seatDetailsFor, validSeatsFor } from '../utils/pricing.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

const ACTIVE_SQUAD_STATUSES = ['gathering', 'voting', 'ready', 'booking in progress'];

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

/**
 * Undo the squad completion made by a booking that is now cancelled:
 * clear the booking details, set the squad back to 'gathering' (votes and
 * availability are kept) and notify the other accepted members.
 */
async function reopenSquad(booking, cancelledBy) {
  const squad = await Squad.findOneAndUpdate(
    { _id: booking.squadId, status: 'completed', bookingId: booking._id },
    {
      $set: { status: 'gathering' },
      $unset: {
        movie: 1, theater: 1, showTime: 1, bookingRef: 1, completionDate: 1,
        bookingId: 1, movieId: 1, showId: 1, attendeeCount: 1
      }
    },
    { new: true }
  );
  if (!squad) return;

  const members = await SquadMember.find({ squadId: squad._id, status: 'accepted' });
  for (const m of members) {
    if (m.userId && m.userId.toString() !== cancelledBy._id.toString()) {
      await Notification.create({
        userId: m.userId,
        title: '↩️ Your CineSquad booking was cancelled.',
        message: `${cancelledBy.name} cancelled the booking for ${squad.name}. The squad is open again, so you can pick a show and book.`,
        type: 'squad_reopened',
        link: `/squads/${squad._id}`
      });
    }
  }
}

// ─── GET /api/bookings/mine ──────────────────────────────────────────────────
router.get('/mine', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'show',
        populate: { path: 'movie' }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/bookings/shared ─────────────────────────────────────────────────
router.get('/shared', protect, async (req, res) => {
  try {
    // Find all squads where user is an accepted member
    const memberships = await SquadMember.find({ email: req.user.email, status: 'accepted' });
    const squadIds = memberships.map(m => m.squadId);
    
    // Find bookings for these squads where user is NOT the host/booker
    const sharedBookings = await Booking.find({
      squadId: { $in: squadIds },
      user: { $ne: req.user._id },
      status: 'confirmed'
    })
    .populate({
      path: 'show',
      populate: { path: 'movie' }
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

    res.json(sharedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/bookings/validate-coupon ──────────────────────────────────────
router.post('/validate-coupon', protect, async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code required' });

    const result = applyCoupon(code, amount);
    if (result.error) return res.status(result.status).json({ message: result.error });

    return res.json({ discount: result.discount, code: result.code });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/bookings ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { showId, seats: rawSeats, couponCode, squadId } = req.body;

    if (!showId || !Array.isArray(rawSeats) || rawSeats.length === 0) {
      return res.status(400).json({ message: 'Show and at least one seat are required' });
    }
    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({ message: 'Invalid show id' });
    }
    if (squadId && !mongoose.isValidObjectId(squadId)) {
      return res.status(400).json({ message: 'Invalid squad id' });
    }

    // Normalise and de-duplicate so the same seat can't be charged twice
    const seats = [...new Set(rawSeats.map((seat) => String(seat).trim().toUpperCase()))];

    const existingShow = await Show.findById(showId);
    if (!existingShow) {
      return res.status(404).json({ message: 'Show not found' });
    }
    if (new Date(existingShow.showTime) <= new Date()) {
      return res.status(400).json({ message: 'This show has already started' });
    }

    const validSeats = validSeatsFor(existingShow);
    const invalidSeats = seats.filter((seat) => !validSeats.has(seat));
    if (invalidSeats.length > 0) {
      return res.status(400).json({ message: `Invalid seats: ${invalidSeats.join(', ')}` });
    }

    // Only the host or an accepted member of an active squad can book on its behalf
    if (squadId) {
      const squad = await Squad.findById(squadId);
      if (!squad) {
        return res.status(404).json({ message: 'Squad not found' });
      }
      if (!ACTIVE_SQUAD_STATUSES.includes(squad.status)) {
        return res.status(400).json({ message: `This squad is ${squad.status} and can no longer be booked` });
      }
      const isHost = squad.hostId.toString() === req.user._id.toString();
      const isMember = await SquadMember.exists({ squadId, email: req.user.email, status: 'accepted' });
      if (!isHost && !isMember) {
        return res.status(403).json({ message: 'You are not a member of this squad' });
      }
    }

    // Atomically reserve the seats; fails if any of them was taken in the meantime
    const show = await Show.findOneAndUpdate(
      { _id: showId, bookedSeats: { $nin: seats } },
      { $addToSet: { bookedSeats: { $each: seats } } },
      { new: true }
    );

    if (!show) {
      const latestShow = await Show.findById(showId);
      const duplicateSeats = seats.filter((seat) => latestShow?.bookedSeats.includes(seat));
      return res.status(409).json({ message: `Seats already booked: ${duplicateSeats.join(', ')}` });
    }

    const seatDetails = seatDetailsFor(seats, show.prices || {});
    const totals = calculateTotals(seatDetails, couponCode);

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        show: show._id,
        seats,
        seatDetails,
        originalAmount: totals.originalAmount,
        discountAmount: totals.discountAmount,
        convenienceFee: totals.convenienceFee,
        finalAmount: totals.finalAmount,
        couponCode: totals.couponCode,
        totalAmount: totals.finalAmount, // Overrides totalAmount so legacy analytics use finalAmount
        bookingRef: generateBookingRef(),
        squadId: squadId || undefined
      });
    } catch (createError) {
      // Release the reserved seats so they don't stay blocked without a booking
      await Show.updateOne({ _id: show._id }, { $pullAll: { bookedSeats: seats } });
      throw createError;
    }

    await booking.populate({
      path: 'show',
      populate: { path: 'movie' }
    });

    if (squadId) {
      // The booking already exists at this point, so a failure here must not fail the request
      try {
        const movieTitle = booking.show.movie?.title || 'Movie';
        const theatre = booking.show.theater || booking.show.city;

        await Squad.findByIdAndUpdate(squadId, {
          status: 'completed',
          movie: movieTitle,
          theater: theatre,
          showTime: booking.show.showTime,
          bookingRef: booking.bookingRef,
          completionDate: new Date(),
          bookingId: booking._id,
          movieId: booking.show.movie?._id,
          showId: booking.show._id,
          attendeeCount: booking.seats.length
        });

        // Create Notifications for all accepted members
        const members = await SquadMember.find({ squadId, status: 'accepted' });
        for (const m of members) {
          if (m.userId && m.userId.toString() !== req.user._id.toString()) {
            await Notification.create({
              userId: m.userId,
              title: '🎬 Your CineSquad plan has been booked.',
              message: `Movie: ${movieTitle} | Booked By: ${req.user.name} | Date: ${new Date(booking.show.showTime).toLocaleString([], {weekday: 'long', hour: '2-digit', minute:'2-digit'})} | Theatre: ${theatre}`,
              link: `/bookings?filter=shared`
            });
          }
        }
      } catch (squadError) {
        console.error('Squad completion update failed:', squadError);
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

// ─── POST /api/bookings/:id/cancel ───────────────────────────────────────────
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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

    // If this booking completed a squad, reopen the squad so the group can book again
    if (booking.squadId) {
      try {
        await reopenSquad(booking, req.user);
      } catch (squadError) {
        console.error('Squad reopen failed:', squadError);
      }
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/bookings/:id/email ────────────────────────────────────────────
router.post('/:id/email', protect, upload.single('ticketPdf'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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

${booking.couponCode ? `Coupon Used: ${booking.couponCode}
Discount Applied: Rs. ${booking.discountAmount}
` : ''}${booking.convenienceFee ? `Convenience Fee: Rs. ${booking.convenienceFee}
` : ''}Total Amount Paid: Rs. ${booking.finalAmount ?? booking.totalAmount}

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
