// Single source of truth for coupon rules, shared by validation and booking creation.
const COUPONS = {
  MOVIE20: (amount) => amount * 0.2,
  WEEKEND25: (amount) => amount * 0.25,
  CARD150: () => 150,
  HELLOCINE: (amount) => amount * 0.5,
  POPCORN99: () => 99
};

const BLOCKED = {
  EXPIRED: 'Coupon Expired',
  INACTIVE: 'Coupon Not Active'
};

/**
 * Returns { code, discount } for a valid coupon, or { error, status } otherwise.
 * The discount never exceeds the order amount.
 */
export function applyCoupon(code, amount) {
  const c = String(code || '').trim().toUpperCase();
  const total = Math.max(0, Number(amount) || 0);

  if (BLOCKED[c]) return { error: BLOCKED[c], status: 400 };
  if (!COUPONS[c]) return { error: 'Invalid Coupon', status: 404 };

  const discount = Math.min(total, Math.round(COUPONS[c](total) * 100) / 100);
  return { code: c, discount };
}
