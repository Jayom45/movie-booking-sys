import { motion } from 'framer-motion';
import { CalendarClock, IndianRupee, MapPin, ShieldCheck, Sofa, Star, Ticket } from 'lucide-react';
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
            <span><Star size={16} /> {movie.rating.toFixed(1)} / 10</span>
            <span>{movie.durationMinutes} mins</span>
            <span>{shows.length} shows</span>
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
    </section>
  );
}
