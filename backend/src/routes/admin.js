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

// GET /api/admin/analytics — comprehensive revenue and insight metrics
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const { timeRange } = req.query; // '7', '30', 'all'
    
    // 1. Determine Date Filter
    let dateFilter = {};
    if (timeRange && timeRange !== 'all') {
      const days = parseInt(timeRange, 10);
      const date = new Date();
      date.setDate(date.getDate() - days);
      dateFilter = { createdAt: { $gte: date } };
    }

    // 2. Fetch all matching bookings with populated show and movie data
    const bookings = await Booking.find(dateFilter).populate({
      path: 'show',
      populate: { path: 'movie' }
    });

    // 3. Process the data
    let totalRevenue = 0;
    let totalBookings = bookings.length;
    let totalCancelled = 0;
    let totalTicketsSold = 0;

    const movieStats = {}; // { movieId: { title, revenue, tickets } }
    const theatreStats = {}; // { theatreName: count }

    for (const b of bookings) {
      if (b.status === 'cancelled') {
        totalCancelled++;
      } else {
        // Successful booking
        totalRevenue += b.totalAmount || 0;
        totalTicketsSold += b.seats?.length || 0;

        if (b.show) {
          // Theatre insights
          const theatre = b.show.theater;
          if (theatre) {
            theatreStats[theatre] = (theatreStats[theatre] || 0) + 1;
          }

          // Movie insights
          if (b.show.movie) {
            const mId = b.show.movie._id.toString();
            if (!movieStats[mId]) {
              movieStats[mId] = {
                title: b.show.movie.title,
                revenue: 0,
                tickets: 0
              };
            }
            movieStats[mId].revenue += b.totalAmount || 0;
            movieStats[mId].tickets += b.seats?.length || 0;
          }
        }
      }
    }

    // 4. Calculate Rates
    const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings) * 100 : 0;

    // 5. Find Top Insights
    let mostPopularMovie = { title: 'N/A', tickets: 0 };
    let topRevenueMovie = { title: 'N/A', revenue: 0 };
    
    for (const stats of Object.values(movieStats)) {
      if (stats.tickets > mostPopularMovie.tickets) {
        mostPopularMovie = { title: stats.title, tickets: stats.tickets };
      }
      if (stats.revenue > topRevenueMovie.revenue) {
        topRevenueMovie = { title: stats.title, revenue: stats.revenue };
      }
    }

    let mostActiveTheatre = { name: 'N/A', count: 0 };
    for (const [name, count] of Object.entries(theatreStats)) {
      if (count > mostActiveTheatre.count) {
        mostActiveTheatre = { name, count };
      }
    }

    res.json({
      cards: {
        totalRevenue,
        totalBookings,
        totalTicketsSold,
        cancellationRate: cancellationRate.toFixed(1)
      },
      insights: {
        mostPopularMovie: mostPopularMovie.title,
        topRevenueMovie: topRevenueMovie.title,
        mostActiveTheatre: mostActiveTheatre.name
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
