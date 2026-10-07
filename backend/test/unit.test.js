import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyCoupon } from '../src/utils/coupons.js';
import { errorStatus } from '../src/utils/errorStatus.js';
import { escapeRegex } from '../src/utils/escapeRegex.js';
import { CONVENIENCE_FEE, calculateTotals, seatDetailsFor, validSeatsFor } from '../src/utils/pricing.js';

describe('applyCoupon', () => {
  it('applies percentage coupons case-insensitively', () => {
    assert.deepEqual(applyCoupon('movie20', 1000), { code: 'MOVIE20', discount: 200 });
    assert.deepEqual(applyCoupon(' weekend25 ', 400), { code: 'WEEKEND25', discount: 100 });
    assert.deepEqual(applyCoupon('HELLOCINE', 360), { code: 'HELLOCINE', discount: 180 });
  });

  it('applies flat coupons', () => {
    assert.deepEqual(applyCoupon('CARD150', 500), { code: 'CARD150', discount: 150 });
    assert.deepEqual(applyCoupon('POPCORN99', 500), { code: 'POPCORN99', discount: 99 });
  });

  it('never discounts more than the amount', () => {
    assert.equal(applyCoupon('CARD150', 100).discount, 100);
    assert.equal(applyCoupon('POPCORN99', 'not a number').discount, 0);
  });

  it('rejects expired, inactive and unknown coupons', () => {
    assert.deepEqual(applyCoupon('EXPIRED', 100), { error: 'Coupon Expired', status: 400 });
    assert.deepEqual(applyCoupon('INACTIVE', 100), { error: 'Coupon Not Active', status: 400 });
    assert.deepEqual(applyCoupon('NOPE', 100), { error: 'Invalid Coupon', status: 404 });
  });
});

describe('validSeatsFor', () => {
  it('builds rows of 10 seats up to totalSeats', () => {
    const seats = validSeatsFor({ totalSeats: 25 });
    assert.equal(seats.size, 25);
    assert.ok(seats.has('A1') && seats.has('A10') && seats.has('B10') && seats.has('C5'));
    assert.ok(!seats.has('C6') && !seats.has('A11') && !seats.has('D1'));
  });

  it('defaults to 40 seats', () => {
    const seats = validSeatsFor({});
    assert.equal(seats.size, 40);
    assert.ok(seats.has('D10'));
  });
});

describe('seatDetailsFor', () => {
  it('prices seats by row category', () => {
    const details = seatDetailsFor(['A1', 'C2', 'E3'], { premium: 400, gold: 300, silver: 200 });
    assert.deepEqual(details, [
      { number: 'A1', category: 'Premium', price: 400 },
      { number: 'C2', category: 'Gold', price: 300 },
      { number: 'E3', category: 'Silver', price: 200 }
    ]);
  });

  it('falls back to default prices', () => {
    const prices = seatDetailsFor(['B1', 'D1', 'F1']).map((s) => s.price);
    assert.deepEqual(prices, [350, 250, 180]);
  });
});

describe('calculateTotals', () => {
  const twoSilver = [{ price: 180 }, { price: 180 }];

  it('adds the convenience fee', () => {
    const totals = calculateTotals(twoSilver);
    assert.equal(totals.originalAmount, 360);
    assert.equal(totals.convenienceFee, CONVENIENCE_FEE);
    assert.equal(totals.finalAmount, 360 + CONVENIENCE_FEE);
    assert.equal(totals.couponCode, null);
  });

  it('discounts the seats only, not the fee', () => {
    const totals = calculateTotals(twoSilver, 'hellocine');
    assert.equal(totals.discountAmount, 180);
    assert.equal(totals.finalAmount, 180 + CONVENIENCE_FEE);
    assert.equal(totals.couponCode, 'HELLOCINE');
  });

  it('ignores invalid coupons', () => {
    const totals = calculateTotals(twoSilver, 'EXPIRED');
    assert.equal(totals.discountAmount, 0);
    assert.equal(totals.couponCode, null);
    assert.equal(totals.finalAmount, 360 + CONVENIENCE_FEE);
  });
});

describe('escapeRegex', () => {
  it('makes special characters literal', () => {
    const pattern = new RegExp(escapeRegex('(a+[b]*?)'));
    assert.ok(pattern.test('x(a+[b]*?)y'));
    assert.ok(!pattern.test('aab'));
  });
});

describe('errorStatus', () => {
  it('maps input errors to 400', () => {
    assert.equal(errorStatus({ name: 'ValidationError' }), 400);
    assert.equal(errorStatus({ name: 'CastError' }), 400);
  });

  it('keeps other statuses', () => {
    assert.equal(errorStatus({ status: 409 }), 409);
    assert.equal(errorStatus(new Error('boom')), 500);
  });
});
