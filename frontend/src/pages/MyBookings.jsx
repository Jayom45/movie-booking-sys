import { motion } from 'framer-motion';
import { CalendarClock, MapPin, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/bookings/mine').then(setBookings).catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="page-hero compact-hero">
        <p className="eyebrow">Your tickets</p>
        <h1>My Bookings</h1>
        <p>All confirmed seats, showtimes, and ticket details in one premium pass library.</p>
      </div>
      {error && <div className="alert">{error}</div>}
      {bookings.length === 0 && !error ? (
        <div className="empty-state"><Ticket size={34} /><h2>No bookings yet</h2><p>Your confirmed movie tickets will appear here.</p></div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking, index) => (
            <motion.article className="booking-card" key={booking._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <img src={booking.show.movie.posterUrl} alt={booking.show.movie.title} />
              <div>
                <span className="premium-label"><Ticket size={14} /> Confirmed</span>
                <h2>{booking.show.movie.title}</h2>
                <p><MapPin size={15} /> {booking.show.theater}, {booking.show.city}</p>
                <p><CalendarClock size={15} /> {new Date(booking.show.showTime).toLocaleString()}</p>
                <strong>Seats: {booking.seats.join(', ')}</strong>
                <span>Paid Rs {booking.totalAmount}</span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
