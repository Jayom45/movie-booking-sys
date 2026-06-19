import express from 'express';
import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Recalculate and persist the average rating and review count on the Movie
 * document after any review mutation (create / update / delete).
 */
async function syncMovieRating(movieId) {
  const [result] = await Review.aggregate([
    { $match: { movie: movieId } },
    {
      $group: {
        _id: '$movie',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result) {
    await Movie.findByIdAndUpdate(movieId, {
      rating: Math.round(result.avgRating * 10) / 10,
      reviewCount: result.count
    });
  } else {
    // All reviews deleted — reset to defaults
    await Movie.findByIdAndUpdate(movieId, { rating: 0, reviewCount: 0 });
  }
}

// ─── GET /api/reviews?movie=<movieId> ────────────────────────────────────────
// Public. Returns all reviews for a movie, newest first.
router.get('/', async (req, res) => {
  try {
    const { movie } = req.query;

    if (!movie) {
      return res.status(400).json({ message: 'movie query param is required' });
    }

    const reviews = await Review.find({ movie })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/reviews ───────────────────────────────────────────────────────
// Auth required. One review per user per movie (enforced by unique index + guard).
router.post('/', protect, async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating || !comment) {
      return res.status(400).json({ message: 'movieId, rating, and comment are required' });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 10' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Guard against duplicate before hitting the unique index error
    const existing = await Review.findOne({ user: req.user._id, movie: movieId });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this movie' });
    }

    const review = await Review.create({
      user: req.user._id,
      movie: movieId,
      rating: parsedRating,
      comment: comment.trim()
    });

    await review.populate('user', 'name');
    await syncMovieRating(review.movie);

    res.status(201).json(review);
  } catch (error) {
    // Catch duplicate key error from the unique index as a fallback
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this movie' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/reviews/:id ────────────────────────────────────────────────────
// Auth required. Only the review owner can edit.
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 10' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'comment is required' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    review.rating = parsedRating;
    review.comment = comment.trim();
    await review.save();
    await review.populate('user', 'name');
    await syncMovieRating(review.movie);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────────
// Auth required. Only the review owner can delete.
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const movieId = review.movie;
    await review.deleteOne();
    await syncMovieRating(movieId);

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
