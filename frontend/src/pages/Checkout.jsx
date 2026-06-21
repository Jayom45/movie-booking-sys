import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, ChevronLeft, CreditCard, IndianRupee, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'credit', label: 'Credit Card', icon: CreditCard },
  { id: 'debit', label: 'Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Smartphone },
  { id: 'wallet', label: 'Wallet', icon: Wallet }
];

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Validate state
  const state = location.state;
  useEffect(() => {
    if (!state || !state.show || !state.seats || state.seats.length === 0) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state || !state.show || !state.seats) return null;

  const { movie, show, seats, baseTotal, convenienceFee } = state;

  const categoryCounts = seats.reduce((acc, seat) => {
    const row = seat.replace(/[0-9]/g, '');
    let cat = 'Silver';
    if (row === 'A' || row === 'B') cat = 'Premium';
    else if (row === 'C' || row === 'D') cat = 'Gold';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryText = Object.entries(categoryCounts).map(([cat, count]) => `${count}x ${cat}`).join(', ');
  const grandTotal = baseTotal + convenienceFee;

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method to continue.');
      return;
    }
    
    setError('');
    setIsProcessing(true);

    // 1. Simulate payment processing (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 2. Create the real booking
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ showId: show._id, seats })
      });

      // 3. Show success state briefly, then redirect
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/bookings', { replace: true });
      }, 1200);

    } catch (err) {
      setError(err.message || 'Failed to process booking. Seats might no longer be available.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="checkout-page checkout-success">
        <motion.div 
          className="glass-panel text-center success-box"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="success-icon-wrap">
            <CheckCircle2 size={48} className="text-green" />
          </div>
          <h2>Payment Successful!</h2>
          <p>Your booking has been confirmed. Generating your QR ticket...</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <Link to={`/movies/${movie._id}`} className="back-link">
        <ChevronLeft size={16} /> Back to seat selection
      </Link>
      
      <div className="checkout-grid">
        {/* ── Order Summary ── */}
        <motion.div 
          className="checkout-summary glass-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="summary-header">
            <p className="eyebrow">Order Summary</p>
            <h2>{movie.title}</h2>
            <span className="summary-tags">{movie.language} | {movie.genre}</span>
          </div>

          <div className="summary-movie-info">
            <img src={movie.posterUrl} alt={movie.title} className="summary-poster" />
            <div className="summary-details">
              <p className="summary-detail-item">
                <strong>{show.theater}</strong>
                <small>{show.city} • {show.screen}</small>
              </p>
              <p className="summary-detail-item">
                <CalendarClock size={14} />
                <span>
                  {new Date(show.showTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                  {new Date(show.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p className="summary-detail-item">
                <span>Seats:</span>
                <strong>{seats.join(', ')}</strong>
                <small>({seats.length} {seats.length === 1 ? 'ticket' : 'tickets'})</small>
              </p>
            </div>
          </div>

          <div className="summary-pricing">
            <div className="price-row">
              <span>Tickets ({categoryText})</span>
              <span>Rs {baseTotal}</span>
            </div>
            <div className="price-row">
              <span>Convenience Fee</span>
              <span>Rs {convenienceFee}</span>
            </div>
            <div className="price-row grand-total">
              <span>Total Amount</span>
              <strong><IndianRupee size={16} /> {grandTotal}</strong>
            </div>
          </div>
        </motion.div>

        {/* ── Payment Methods ── */}
        <motion.div 
          className="checkout-payment glass-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="payment-header">
            <p className="eyebrow">Secure Checkout</p>
            <h2>Payment Method</h2>
            <p className="payment-sub">Select a method to complete your booking.</p>
          </div>

          {error && <div className="alert">{error}</div>}

          <div className="payment-methods-grid">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button 
                  key={method.id} 
                  className={`payment-method-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={isProcessing}
                >
                  <Icon size={20} />
                  <span>{method.label}</span>
                  {isSelected && <CheckCircle2 size={16} className="method-check" />}
                </button>
              );
            })}
          </div>

          <div className="payment-action-box">
            <p className="secure-badge">
              <ShieldCheck size={14} /> 100% Secure Payment Simulation
            </p>
            <button 
              className={`button primary pay-now-btn ${isProcessing ? 'processing' : ''}`}
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Payment...' : `Pay Rs ${grandTotal}`}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
