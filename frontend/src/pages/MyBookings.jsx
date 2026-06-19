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
      <h1>My Bookings</h1>
      {error && <div className="alert">{error}</div>}
      <div className="booking-list">
        {bookings.map((booking) => (
          <article className="booking-card" key={booking._id}>
            <img src={booking.show.movie.posterUrl} alt={booking.show.movie.title} />
            <div>
              <h2>{booking.show.movie.title}</h2>
              <p>{booking.show.theater}, {booking.show.city}</p>
              <p>{new Date(booking.show.showTime).toLocaleString()}</p>
              <strong>Seats: {booking.seats.join(', ')}</strong>
              <span>Paid ₹{booking.totalAmount}</span>
            </div>
          </article>
        ))}
      </div>
      {bookings.length === 0 && !error && <div className="muted">No bookings yet.</div>}
    </section>
  );
}
