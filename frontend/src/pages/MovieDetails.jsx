import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, IndianRupee, MapPin, MessageSquare, Pencil, ShieldCheck, Sofa, Star, Ticket, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

const rows = ['A', 'B', 'C', 'D'];
const seats = rows.flatMap((row) => Array.from({ length: 10 }, (_, index) => `${row}${index + 1}`));

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-input" role="group" aria-label="Rating">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? 'star-btn-active' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} out of 10`}
        >
          <Star size={20} />
        </button>
      ))}
      {value > 0 && <span className="star-value">{value} / 10</span>}
    </div>
  );
}

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onEdit, onDelete }) {
  const isOwner = currentUserId && review.user._id === currentUserId;

  return (
    <motion.article
      className="review-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="review-header">
        <div className="review-author">
          <span className="review-avatar">{review.user.name.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{review.user.name}</strong>
            <time>{timeAgo(review.createdAt)}</time>
          </div>
        </div>
        <div className="review-rating-badge">
          <Star size={14} />
          {review.rating} / 10
        </div>
      </div>

      <div className="review-stars-row">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
          <Star
            key={star}
            size={15}
            className={star <= review.rating ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>

      <p className="review-comment">{review.comment}</p>

      {isOwner && (
        <div className="review-actions">
          <button className="review-action-btn" onClick={() => onEdit(review)}>
            <Pencil size={14} /> Edit
          </button>
          <button className="review-action-btn danger" onClick={() => onDelete(review._id)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </motion.article>
  );
}

// ─── Review Form ─────────────────────────────────────────────────────────────
function ReviewForm({ movieId, existingReview, onSuccess, onCancel }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(existingReview);

  async function handleSubmit(event) {
    event.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      let saved;
      if (isEditing) {
        saved = await api(`/reviews/${existingReview._id}`, {
          method: 'PUT',
          body: JSON.stringify({ rating, comment })
        });
      } else {
        saved = await api('/reviews', {
          method: 'POST',
          body: JSON.stringify({ movieId, rating, comment })
        });
      }
      onSuccess(saved, isEditing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      className="review-form glass-panel"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="eyebrow">{isEditing ? 'Edit your review' : 'Write a review'}</p>
      <h3 style={{ marginBottom: '16px' }}>{isEditing ? 'Update your thoughts' : 'Share your experience'}</h3>

      <label>
        Your Rating
        <StarRatingInput value={rating} onChange={setRating} />
      </label>

      <label>
        Your Review
        <textarea
          className="review-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think of this movie?"
          maxLength={1000}
          rows={4}
        />
        <span className="char-count">{comment.length} / 1000</span>
      </label>

      {error && <div className="alert">{error}</div>}

      <div className="review-form-actions">
        <button className="button primary" disabled={loading}>
          {loading ? 'Saving…' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
        {isEditing && (
          <button type="button" className="button glass" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}

// ─── Review Section ───────────────────────────────────────────────────────────
function ReviewSection({ movieId, movie, user, onMovieRatingUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const userReview = useMemo(
    () => (user ? reviews.find((r) => r.user._id === user.id) : null),
    [reviews, user]
  );

  async function loadReviews() {
    try {
      setLoading(true);
      const data = await api(`/reviews?movie=${movieId}`);
      setReviews(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [movieId]);

  function handleSuccess(saved, isEditing) {
    if (isEditing) {
      setReviews((prev) => prev.map((r) => (r._id === saved._id ? saved : r)));
    } else {
      setReviews((prev) => [saved, ...prev]);
    }
    setEditingReview(null);
    // Trigger parent to refresh movie data for updated rating
    if (onMovieRatingUpdate) onMovieRatingUpdate();
  }

  async function handleDelete(reviewId) {
    try {
      setDeleteError('');
      await api(`/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setEditingReview(null);
      if (onMovieRatingUpdate) onMovieRatingUpdate();
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  const avgRating = movie?.rating || 0;
  const reviewCount = movie?.reviewCount || reviews.length;

  return (
    <section className="review-section">
      {/* ── Section header ── */}
      <div className="review-section-header">
        <div>
          <p className="eyebrow">Community</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={22} />
            Reviews & Ratings
          </h2>
        </div>
        <div className="review-avg-block">
          <div className="review-avg-score">
            <Star size={22} className="star-filled" />
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </div>
          <span className="review-avg-label">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {/* ── Rating distribution visual ── */}
      {reviews.length > 0 && (
        <div className="review-stars-display">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
            <Star
              key={star}
              size={18}
              className={star <= Math.round(avgRating) ? 'star-filled' : 'star-empty'}
            />
          ))}
          <span>{avgRating > 0 ? `${avgRating.toFixed(1)} average` : ''}</span>
        </div>
      )}

      {/* ── Submit / Edit form ── */}
      {user ? (
        userReview && !editingReview ? (
          <div className="already-reviewed-note">
            <ShieldCheck size={16} />
            You reviewed this movie. Select your review below to edit or delete it.
          </div>
        ) : !editingReview ? (
          <ReviewForm
            movieId={movieId}
            existingReview={null}
            onSuccess={handleSuccess}
            onCancel={() => setEditingReview(null)}
          />
        ) : null
      ) : (
        <div className="review-login-prompt glass-panel">
          <MessageSquare size={20} />
          <span>
            <Link to="/login">Login</Link> to write a review for this movie.
          </span>
        </div>
      )}

      {/* ── Inline edit form (shown below the prompt area) ── */}
      {editingReview && (
        <ReviewForm
          movieId={movieId}
          existingReview={editingReview}
          onSuccess={handleSuccess}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {deleteError && <div className="alert">{deleteError}</div>}

      {/* ── Review list ── */}
      {loading ? (
        <div className="review-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="review-card review-skeleton">
              <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: '999px' }} />
              <div className="skeleton" style={{ width: '100%', height: '56px', borderRadius: '12px', marginTop: '12px' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '180px' }}>
          <MessageSquare size={28} />
          <h2>No reviews yet</h2>
          <p>Be the first to share your thoughts on this movie.</p>
        </div>
      ) : (
        <div className="review-list">
          <AnimatePresence>
            {reviews.map((review) => (
              editingReview?._id === review._id ? null : (
                <ReviewCard
                  key={review._id}
                  review={review}
                  currentUserId={user?.id}
                  onEdit={setEditingReview}
                  onDelete={handleDelete}
                />
              )
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

// ─── Main MovieDetails Page ───────────────────────────────────────────────────
export default function MovieDetails({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadMovie() {
    const data = await api(`/movies/${id}`);
    setMovie(data.movie);
    setShows(data.shows);
    setSelectedShowId((current) => current || data.shows[0]?._id || '');
    setSelectedDate((current) => current || (data.shows[0] ? dateKey(data.shows[0].showTime) : ''));
  }

  useEffect(() => {
    loadMovie().catch((err) => setError(err.message));
  }, [id]);

  const cities = useMemo(() => [...new Set(shows.map((show) => show.city))], [shows]);
  const dates = useMemo(() => [...new Set(shows.map((show) => dateKey(show.showTime)))], [shows]);
  const visibleShows = useMemo(
    () => shows.filter((show) => (!selectedCity || show.city === selectedCity) && (!selectedDate || dateKey(show.showTime) === selectedDate)),
    [selectedCity, selectedDate, shows]
  );
  const selectedShow = useMemo(() => shows.find((show) => show._id === selectedShowId), [shows, selectedShowId]);
  const total = selectedSeats.length * (selectedShow?.price || 0);

  useEffect(() => {
    if (visibleShows.length > 0 && !visibleShows.some((show) => show._id === selectedShowId)) {
      setSelectedShowId(visibleShows[0]._id);
      setSelectedSeats([]);
    }
  }, [selectedShowId, visibleShows]);

  function toggleSeat(seat) {
    if (selectedShow?.bookedSeats.includes(seat)) return;
    setSelectedSeats((current) => (current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat]));
  }

  async function bookTickets() {
    try {
      setError('');
      setMessage('');
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ showId: selectedShowId, seats: selectedSeats })
      });
      await loadMovie();
      setSelectedSeats([]);
      setMessage('Booking confirmed. Your tickets are in My Bookings.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !movie) return <div className="alert">{error}</div>;
  if (!movie) return <div className="detail-skeleton"><div className="skeleton hero-skeleton" /><div className="skeleton panel-skeleton" /></div>;

  return (
    <section className="movie-detail-page">
      <section className="detail-hero" style={{ '--hero-image': `url(${movie.posterUrl})` }}>
        <motion.img className="detail-poster" src={movie.posterUrl} alt={movie.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} />
        <motion.div className="detail-copy" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
          <p className="eyebrow">{movie.genre} | {movie.language}</p>
          <h1>{movie.title}</h1>
          <p>{movie.description}</p>
          <div className="spotlight-meta">
            <span><Star size={16} /> {movie.rating > 0 ? movie.rating.toFixed(1) : 'No ratings'} / 10</span>
            <span>{movie.durationMinutes} mins</span>
            <span>{shows.length} shows</span>
            {movie.reviewCount > 0 && (
              <span><MessageSquare size={16} /> {movie.reviewCount} {movie.reviewCount === 1 ? 'review' : 'reviews'}</span>
            )}
          </div>
          <div className="mini-facts horizontal">
            <span><Sofa size={16} /> Reserved seating</span>
            <span><ShieldCheck size={16} /> Secure checkout</span>
          </div>
        </motion.div>
      </section>

      <section className="booking-grid">
        <div className="glass-panel">
          <div className="rail-heading compact">
            <div>
              <p className="eyebrow">Select experience</p>
              <h2>Showtimes</h2>
            </div>
          </div>
          <div className="chip-row">
            {dates.map((date) => (
              <button className={selectedDate === date ? 'chip active' : 'chip'} key={date} onClick={() => setSelectedDate(date)}>
                {formatDate(date)}
              </button>
            ))}
          </div>
          <div className="chip-row">
            <button className={!selectedCity ? 'chip active' : 'chip'} onClick={() => setSelectedCity('')}>All cities</button>
            {cities.map((city) => (
              <button className={selectedCity === city ? 'chip active' : 'chip'} key={city} onClick={() => setSelectedCity(city)}>
                <MapPin size={14} /> {city}
              </button>
            ))}
          </div>

          <div className="show-list">
            {visibleShows.map((show) => (
              <button className={show._id === selectedShowId ? 'show-option active' : 'show-option'} key={show._id} onClick={() => { setSelectedShowId(show._id); setSelectedSeats([]); }}>
                <CalendarClock size={18} />
                <span>{show.theater}, {show.city}<small>{formatTime(show.showTime)} | {show.screen} | {show.totalSeats - show.bookedSeats.length} seats left</small></span>
                <strong>Rs {show.price}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel seat-panel">
          {selectedShow ? (
            <>
              <div className="screen">IMAX SCREEN</div>
              <div className="legend-row">
                <span><i className="legend-dot available" /> Available</span>
                <span><i className="legend-dot selected" /> Selected</span>
                <span><i className="legend-dot booked" /> Booked</span>
              </div>
              <div className="seat-grid">
                {seats.map((seat) => {
                  const booked = selectedShow.bookedSeats.includes(seat);
                  const selected = selectedSeats.includes(seat);
                  return (
                    <button key={seat} className={`seat ${booked ? 'booked' : ''} ${selected ? 'selected' : ''}`} onClick={() => toggleSeat(seat)} disabled={booked}>
                      {seat}
                    </button>
                  );
                })}
              </div>
              <div className="checkout-bar">
                <div>
                  <span>{selectedSeats.length ? selectedSeats.join(', ') : 'Choose your seats'}</span>
                  <strong><IndianRupee size={16} /> {total}</strong>
                </div>
                {user ? (
                  <button className="button primary" onClick={bookTickets} disabled={selectedSeats.length === 0}><Ticket size={17} /> Confirm Booking</button>
                ) : (
                  <Link className="button primary" to="/login">Login to Book</Link>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state"><CalendarClock size={34} /><h2>No shows match these filters</h2><p>Try another city or date.</p></div>
          )}
        </div>
      </section>

      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}

      {/* ── Reviews & Ratings ── */}
      <ReviewSection
        movieId={id}
        movie={movie}
        user={user}
        onMovieRatingUpdate={loadMovie}
      />
    </section>
  );
}
