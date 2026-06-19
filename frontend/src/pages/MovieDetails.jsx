import { CalendarClock, IndianRupee } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

const rows = ['A', 'B', 'C', 'D'];
const seats = rows.flatMap((row) => Array.from({ length: 10 }, (_, index) => `${row}${index + 1}`));

export default function MovieDetails({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMovie() {
      try {
        const data = await api(`/movies/${id}`);
        setMovie(data.movie);
        setShows(data.shows);
        setSelectedShowId(data.shows[0]?._id || '');
      } catch (err) {
        setError(err.message);
      }
    }

    loadMovie();
  }, [id]);

  const selectedShow = useMemo(() => shows.find((show) => show._id === selectedShowId), [shows, selectedShowId]);
  const total = selectedSeats.length * (selectedShow?.price || 0);

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

      const updated = await api(`/movies/${id}`);
      setShows(updated.shows);
      setSelectedSeats([]);
      setMessage('Booking confirmed. Your tickets are in My Bookings.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !movie) return <div className="alert">{error}</div>;
  if (!movie) return <div className="muted">Loading movie...</div>;

  return (
    <section className="details-layout">
      <img className="poster-large" src={movie.posterUrl} alt={movie.title} />

      <div className="details-main">
        <p className="eyebrow">{movie.genre} · {movie.language}</p>
        <h1>{movie.title}</h1>
        <p className="description">{movie.description}</p>
        <div className="meta-row">
          <span>{movie.durationMinutes} mins</span>
          <span>{movie.rating.toFixed(1)} / 10</span>
          <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
        </div>

        <h2>Shows</h2>
        <div className="show-list">
          {shows.map((show) => (
            <button
              className={show._id === selectedShowId ? 'show-option active' : 'show-option'}
              key={show._id}
              onClick={() => {
                setSelectedShowId(show._id);
                setSelectedSeats([]);
              }}
            >
              <CalendarClock size={18} />
              <span>
                {show.theater}, {show.city}
                <small>{new Date(show.showTime).toLocaleString()} · {show.screen}</small>
              </span>
              <strong>₹{show.price}</strong>
            </button>
          ))}
        </div>

        {selectedShow ? (
          <>
            <div className="screen">SCREEN</div>
            <div className="seat-grid">
              {seats.map((seat) => {
                const booked = selectedShow.bookedSeats.includes(seat);
                const selected = selectedSeats.includes(seat);
                return (
                  <button
                    key={seat}
                    className={`seat ${booked ? 'booked' : ''} ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSeat(seat)}
                    disabled={booked}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>

            <div className="checkout-bar">
              <div>
                <span>{selectedSeats.length} seat(s)</span>
                <strong><IndianRupee size={16} /> {total}</strong>
              </div>
              {user ? (
                <button className="button primary" onClick={bookTickets} disabled={selectedSeats.length === 0}>
                  Confirm Booking
                </button>
              ) : (
                <Link className="button primary" to="/login">Login to Book</Link>
              )}
            </div>
          </>
        ) : (
          <div className="muted">No upcoming shows available.</div>
        )}

        {message && <div className="success">{message}</div>}
        {error && <div className="alert">{error}</div>}
      </div>
    </section>
  );
}
