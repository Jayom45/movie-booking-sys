import { applyCoupon } from './coupons.js';

// Flat fee added to every booking. Keep in sync with CONVENIENCE_FEE in frontend/src/pages/MovieDetails.jsx.
export const CONVENIENCE_FEE = 40;

/**
 * All valid seat ids for a show. Mirrors the seat map built in MovieDetails.jsx:
 * rows of 10 seats labelled A, B, C… until totalSeats is reached.
 */
export function validSeatsFor(show) {
  const total = show.totalSeats || 40;
  const seats = new Set();
  for (let i = 0; i < total; i++) {
    const rowChar = String.fromCharCode(65 + (Math.floor(i / 10) % 26));
    seats.add(`${rowChar}${(i % 10) + 1}`);
  }
  return seats;
}

// Rows A–B are Premium, C–D Gold, everything else Silver.
export function seatDetailsFor(seats, prices = {}) {
  return seats.map((seat) => {
    const row = seat.replace(/[0-9]/g, '');
    if (row === 'A' || row === 'B') return { number: seat, category: 'Premium', price: prices.premium || 350 };
    if (row === 'C' || row === 'D') return { number: seat, category: 'Gold', price: prices.gold || 250 };
    return { number: seat, category: 'Silver', price: prices.silver || 180 };
  });
}

/**
 * Booking totals. The coupon discount applies to the seat amount only;
 * the convenience fee is added on top and is never discounted.
 */
export function calculateTotals(seatDetails, couponCode) {
  const originalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);
  const coupon = couponCode ? applyCoupon(couponCode, originalAmount) : null;
  const discountAmount = coupon && !coupon.error ? coupon.discount : 0;
  const finalAmount = Math.max(0, originalAmount - discountAmount) + CONVENIENCE_FEE;

  return {
    originalAmount,
    discountAmount,
    convenienceFee: CONVENIENCE_FEE,
    finalAmount,
    couponCode: discountAmount > 0 ? coupon.code : null
  };
}
