import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, CheckCircle2, Hash, MapPin, QrCode, Ticket, XCircle, Download, Mail } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { generateAndOpenTicketPdf, generatePdfBlob } from '../pdfGenerator.jsx';

// ─── Build the plain-text QR payload ─────────────────────────────────────────
function buildQrPayload(booking) {
  const show = booking.show;
  const movie = show.movie;
  const dateStr = new Date(show.showTime).toLocaleString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return [
    '▶ CINEBOOK TICKET',
    `Ref     : ${booking.bookingRef || booking._id}`,
    `Movie   : ${movie.title}`,
    `Theatre : ${show.theater}, ${show.city}`,
    `Screen  : ${show.screen}`,
    `Time    : ${dateStr}`,
    `Seats   : ${booking.seats.join(', ')}`,
    `Amount  : Rs ${booking.totalAmount}`
  ].join('\n');
}

// ─── QR Code image component ──────────────────────────────────────────────────
function QRTicketCode({ booking }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const payload = buildQrPayload(booking);
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0b0d14',   // dark module colour — matches app background
        light: '#f7f7fb'   // light module colour — matches app text
      },
      errorCorrectionLevel: 'M'
    }).then(setQrDataUrl);
  }, [booking]);

  if (!qrDataUrl) {
    return <div className="qr-placeholder skeleton" />;
  }

  return <img className="qr-image" src={qrDataUrl} alt="Booking QR Code" />;
}

// ─── Single ticket card ───────────────────────────────────────────────────────
function BookingTicket({ booking, index, onCancel }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const show = booking.show;
  const movie = show.movie;
  const ref = booking.bookingRef;

  return (
    <motion.article
      className="ticket-card"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      {/* ── Left: poster strip ── */}
      <div className="ticket-poster-strip">
        <img src={movie.posterUrl} alt={movie.title} className="ticket-poster" />
        <div className="ticket-perforation" />
      </div>

      {/* ── Centre: details ── */}
      <div className="ticket-body">
        <div className="ticket-status-row">
          {booking.status === 'cancelled' ? (
            <span className="premium-label ticket-cancelled-label">
              <XCircle size={14} /> Cancelled
            </span>
          ) : (
            <span className="premium-label ticket-confirmed-label">
              <CheckCircle2 size={14} /> Confirmed
            </span>
          )}
          {ref && (
            <span className="ticket-ref">
              <Hash size={12} /> {ref}
            </span>
          )}
        </div>

        <h2 className="ticket-title">{movie.title}</h2>
        <p className="ticket-genre">{movie.genre} · {movie.language}</p>

        <div className="ticket-info-grid">
          <div className="ticket-info-item">
            <MapPin size={14} />
            <div>
              <span className="ticket-info-label">Theatre</span>
              <strong>{show.theater}</strong>
              <small>{show.city} · {show.screen}</small>
            </div>
          </div>
          <div className="ticket-info-item">
            <CalendarClock size={14} />
            <div>
              <span className="ticket-info-label">Date & Time</span>
              <strong>
                {new Date(show.showTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </strong>
              <small>{new Date(show.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          </div>
          <div className="ticket-info-item">
            <Ticket size={14} />
            <div>
              <span className="ticket-info-label">Seats</span>
              <strong>{booking.seats.join(', ')}</strong>
              <small>{booking.seats.length} {booking.seats.length === 1 ? 'ticket' : 'tickets'}</small>
            </div>
          </div>
          <div className="ticket-info-item ticket-amount">
            <div>
              <span className="ticket-info-label">Total Paid</span>
              <strong className="ticket-price">Rs {booking.totalAmount}</strong>
              {booking.couponCode && (
                <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>
                  <div>Coupon: {booking.couponCode}</div>
                  <div style={{ color: 'var(--green)' }}>Discount: -Rs {booking.discountAmount}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="ticket-actions">
          {booking.status !== 'cancelled' && (
            <>
              <button
                className={`qr-toggle-btn ${qrOpen ? 'qr-toggle-btn-active' : ''}`}
                onClick={() => setQrOpen((prev) => !prev)}
              >
                <QrCode size={16} />
                {qrOpen ? 'Hide QR Ticket' : 'Show QR Ticket'}
              </button>
              <button
                className="btn-pdf"
                onClick={async () => {
                  setGeneratingPdf(true);
                  try {
                    await generateAndOpenTicketPdf(booking);
                  } finally {
                    setGeneratingPdf(false);
                  }
                }}
                disabled={generatingPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Download size={15} />
                {generatingPdf ? 'Opening...' : 'Download PDF'}
              </button>
              <button
                className="btn-email"
                onClick={async () => {
                  setEmailing(true);
                  try {
                    const pdfBlob = await generatePdfBlob(booking);
                    const formData = new FormData();
                    formData.append('ticketPdf', pdfBlob, `ticket-${booking._id}.pdf`);
                    const res = await api(`/bookings/${booking._id}/email`, {
                      method: 'POST',
                      body: formData
                    });
                    alert(res.message || 'Ticket sent successfully!');
                  } catch (err) {
                    alert(err.message || 'Failed to email ticket.');
                  } finally {
                    setEmailing(false);
                  }
                }}
                disabled={emailing}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Mail size={15} />
                {emailing ? 'Sending...' : 'Email Ticket'}
              </button>
              <button
                className="btn-cancel"
                onClick={async () => {
                  setCancelling(true);
                  await onCancel(booking._id);
                  setCancelling(false);
                }}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </>
          )}
        </div>

        {/* ── Expandable QR panel ── */}
        {qrOpen && booking.status !== 'cancelled' && (
          <motion.div
            className="qr-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="qr-panel-inner">
              <QRTicketCode booking={booking} />
              <div className="qr-meta">
                <p className="eyebrow">Scan to verify</p>
                <p className="qr-instructions">
                  Present this QR at the cinema entrance. The staff will scan it to verify your booking.
                </p>
                {ref && (
                  <div className="qr-ref-box">
                    <span>Booking Reference</span>
                    <code>{ref}</code>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('/bookings/mine')
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      const updatedBooking = await api(`/bookings/${bookingId}/cancel`, { method: 'POST' });
      setBookings((prevBookings) =>
        prevBookings.map((b) => (b._id === bookingId ? { ...b, status: updatedBooking.status } : b))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Filter Logic ───
  const now = new Date();
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && new Date(b.show.showTime) > now);
  const completedBookings = bookings.filter(b => b.status !== 'cancelled' && new Date(b.show.showTime) <= now);

  const displayedBookings = filter === 'all' ? bookings :
                            filter === 'upcoming' ? upcomingBookings :
                            filter === 'completed' ? completedBookings :
                            cancelledBookings;

  const counts = {
    all: bookings.length,
    upcoming: upcomingBookings.length,
    completed: completedBookings.length,
    cancelled: cancelledBookings.length
  };

  return (
    <section>
      <div className="page-hero compact-hero">
        <p className="eyebrow">Your tickets</p>
        <h1>My Bookings</h1>
        <p>All confirmed seats, showtimes, and QR ticket passes in one premium library.</p>
      </div>

      {/* ── Filters ── */}
      {!loading && !error && bookings.length > 0 && (
        <div className="filter-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginTop: '20px' }}>
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: `1px solid ${filter === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                background: filter === tab.id ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                color: filter === tab.id ? 'var(--gold)' : '#9ca3af',
                fontWeight: filter === tab.id ? 'bold' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.label} <span style={{ opacity: 0.6, fontSize: '0.8em' }}>({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="booking-list" style={{ marginTop: '22px' }}>
          {[1, 2].map((i) => (
            <div key={i} className="ticket-card ticket-skeleton">
              <div className="ticket-poster-strip skeleton" style={{ width: '130px', borderRadius: '20px 0 0 20px' }} />
              <div className="ticket-body" style={{ gap: '12px' }}>
                <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: '999px' }} />
                <div className="skeleton" style={{ width: '70%', height: '22px', borderRadius: '999px' }} />
                <div className="skeleton" style={{ width: '90%', height: '80px', borderRadius: '16px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayedBookings.length === 0 && !error ? (
        <div className="empty-state">
          <Ticket size={34} />
          <h2>No bookings found</h2>
          <p>You have no {filter !== 'all' ? filter : ''} bookings.</p>
        </div>
      ) : (
        <div className="booking-list" style={{ marginTop: '22px' }}>
          <AnimatePresence mode="popLayout">
            {displayedBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <BookingTicket booking={booking} index={index} onCancel={handleCancelBooking} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
