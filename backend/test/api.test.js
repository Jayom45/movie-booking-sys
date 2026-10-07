// End-to-end API tests. They run the real Express app against a separate
// MongoDB database (<your database>_test), which is wiped before and after the run.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import Booking from '../src/models/Booking.js';
import Movie from '../src/models/Movie.js';
import Notification from '../src/models/Notification.js';
import Show from '../src/models/Show.js';
import Squad from '../src/models/Squad.js';
import SquadMember from '../src/models/SquadMember.js';
import User from '../src/models/User.js';
import { CONVENIENCE_FEE } from '../src/utils/pricing.js';

dotenv.config();
process.env.JWT_SECRET ||= 'test-secret';
// Keep the test run from sending real emails
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

function testDatabaseUri() {
  if (process.env.TEST_MONGO_URI) return process.env.TEST_MONGO_URI;
  const url = new URL(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movie_booking');
  const name = url.pathname.replace(/^\//, '') || 'movie_booking';
  url.pathname = `/${name}_test`;
  return url.toString();
}

let server;
let baseUrl;
const tokens = {};
const ids = {};

async function request(method, path, { token, body, rawBody } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body))
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

before(async () => {
  await mongoose.connect(testDatabaseUri(), { serverSelectionTimeoutMS: 5000 });
  const dbName = mongoose.connection.db.databaseName;
  if (!dbName.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${dbName}": the database name must end with _test`);
  }
  await mongoose.connection.db.dropDatabase();
  await Promise.all([Booking.init(), User.init(), SquadMember.init()]);

  const [admin, user, friend, outsider] = await Promise.all([
    User.create({ name: 'Admin', email: 'admin@test.dev', password: 'admin123', role: 'admin' }),
    User.create({ name: 'User', email: 'user@test.dev', password: 'user123' }),
    User.create({ name: 'Friend', email: 'friend@test.dev', password: 'friend123' }),
    User.create({ name: 'Outsider', email: 'outsider@test.dev', password: 'outsider123' })
  ]);
  for (const [key, u] of Object.entries({ admin, user, friend, outsider })) {
    ids[key] = u._id.toString();
    tokens[key] = jwt.sign({ id: u._id }, process.env.JWT_SECRET);
  }

  const movie = await Movie.create({
    title: 'Test Movie',
    description: 'A movie for tests',
    genre: ['Drama'],
    language: 'English',
    durationMinutes: 120,
    posterUrl: 'https://example.com/poster.jpg',
    releaseDate: new Date('2026-01-01')
  });
  ids.movie = movie._id.toString();

  const showBase = { movie: movie._id, theater: 'Test Theatre', city: 'Test City', screen: '1', totalSeats: 60 };
  const prices = { premium: 350, gold: 250, silver: 180 };
  const [futureShow, pastShow, squadShow, deletableShow] = await Promise.all([
    Show.create({ ...showBase, showTime: hoursFromNow(48), prices }),
    Show.create({ ...showBase, showTime: hoursFromNow(-48), prices }),
    Show.create({ ...showBase, screen: '2', showTime: hoursFromNow(72), prices }),
    Show.create({ ...showBase, screen: '3', showTime: hoursFromNow(96), prices })
  ]);
  ids.futureShow = futureShow._id.toString();
  ids.pastShow = pastShow._id.toString();
  ids.squadShow = squadShow._id.toString();
  ids.deletableShow = deletableShow._id.toString();

  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server?.close(resolve) ?? resolve());
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('auth', () => {
  it('registers a new user', async () => {
    const res = await request('POST', '/auth/register', {
      body: { name: 'New', email: '  New@Test.dev ', password: 'secret1' }
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.email, 'new@test.dev');
    assert.ok(res.data.token);
  });

  it('rejects a duplicate email', async () => {
    const res = await request('POST', '/auth/register', {
      body: { name: 'Dup', email: 'USER@test.dev', password: 'secret1' }
    });
    assert.equal(res.status, 409);
  });

  it('rejects a short password', async () => {
    const res = await request('POST', '/auth/register', {
      body: { name: 'Short', email: 'short@test.dev', password: '123' }
    });
    assert.equal(res.status, 400);
  });

  it('logs in regardless of email case and spacing', async () => {
    const res = await request('POST', '/auth/login', { body: { email: ' USER@TEST.DEV ', password: 'user123' } });
    assert.equal(res.status, 200);
    assert.ok(res.data.token);
  });

  it('rejects a wrong password and missing fields', async () => {
    assert.equal((await request('POST', '/auth/login', { body: { email: 'user@test.dev', password: 'nope' } })).status, 401);
    assert.equal((await request('POST', '/auth/login', { body: { email: 'user@test.dev' } })).status, 400);
  });

  it('returns JSON 400 for malformed JSON', async () => {
    const res = await request('POST', '/auth/login', { rawBody: '{bad json' });
    assert.equal(res.status, 400);
    assert.equal(res.data.message, 'Invalid JSON in request body');
  });

  it('rejects requests without a valid token', async () => {
    assert.equal((await request('GET', '/bookings/mine')).status, 401);
    assert.equal((await request('GET', '/bookings/mine', { token: 'garbage' })).status, 401);
  });
});

describe('movies and shows', () => {
  it('lists active movies and searches safely with special characters', async () => {
    const list = await request('GET', '/movies');
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 1);

    const found = await request('GET', '/movies?search=test');
    assert.equal(found.data.length, 1);

    const special = await request('GET', `/movies?search=${encodeURIComponent('(')}`);
    assert.equal(special.status, 200);
    assert.deepEqual(special.data, []);
  });

  it('returns 404 for a malformed movie or show id instead of crashing', async () => {
    assert.equal((await request('GET', '/movies/not-an-id')).status, 404);
    assert.equal((await request('GET', '/shows/not-an-id')).status, 404);
    assert.equal((await request('GET', '/health')).status, 200);
  });

  it('only lets admins create movies, and validates input', async () => {
    assert.equal((await request('POST', '/movies', { token: tokens.user, body: { title: 'X' } })).status, 403);
    assert.equal((await request('POST', '/movies', { token: tokens.admin, body: { title: 'Missing fields' } })).status, 400);
  });

  it('filters shows by city safely', async () => {
    const res = await request('GET', `/shows?city=${encodeURIComponent('[')}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, []);
  });
});

describe('bookings', () => {
  let bookingId;

  it('creates a booking with the convenience fee and coupon applied', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.user,
      body: { showId: ids.futureShow, seats: ['e1', 'E2', 'E2'], couponCode: 'hellocine' }
    });
    assert.equal(res.status, 201);
    bookingId = res.data._id;

    // Duplicate seat removed and ids normalised: 2 Silver seats at 180
    assert.deepEqual(res.data.seats, ['E1', 'E2']);
    assert.equal(res.data.originalAmount, 360);
    assert.equal(res.data.discountAmount, 180);
    assert.equal(res.data.convenienceFee, CONVENIENCE_FEE);
    assert.equal(res.data.finalAmount, 180 + CONVENIENCE_FEE);
    assert.equal(res.data.totalAmount, res.data.finalAmount);
    assert.equal(res.data.couponCode, 'HELLOCINE');
    assert.match(res.data.bookingRef, /^BK-[A-Z0-9]{8}$/);

    const show = await Show.findById(ids.futureShow);
    assert.deepEqual([...show.bookedSeats].sort(), ['E1', 'E2']);
  });

  it('refuses seats that are already booked', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.friend,
      body: { showId: ids.futureShow, seats: ['E2', 'E3'] }
    });
    assert.equal(res.status, 409);
    assert.match(res.data.message, /E2/);
    // E3 must not have been reserved by the failed attempt
    const show = await Show.findById(ids.futureShow);
    assert.ok(!show.bookedSeats.includes('E3'));
  });

  it('refuses seats that do not exist in the hall', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.user,
      body: { showId: ids.futureShow, seats: ['Z99'] }
    });
    assert.equal(res.status, 400);
  });

  it('refuses shows that have already started', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.user,
      body: { showId: ids.pastShow, seats: ['A1'] }
    });
    assert.equal(res.status, 400);
  });

  it('refuses bad show ids and empty seat lists', async () => {
    assert.equal((await request('POST', '/bookings', { token: tokens.user, body: { showId: 'bad', seats: ['A1'] } })).status, 400);
    assert.equal((await request('POST', '/bookings', { token: tokens.user, body: { showId: ids.futureShow, seats: [] } })).status, 400);
  });

  it('lists the user\'s bookings', async () => {
    const res = await request('GET', '/bookings/mine', { token: tokens.user });
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].show.movie.title, 'Test Movie');
  });

  it('validates coupons and caps the discount', async () => {
    const ok = await request('POST', '/bookings/validate-coupon', { token: tokens.user, body: { code: 'card150', amount: 100 } });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.discount, 100);
    assert.equal((await request('POST', '/bookings/validate-coupon', { token: tokens.user, body: { code: 'EXPIRED', amount: 100 } })).status, 400);
    assert.equal((await request('POST', '/bookings/validate-coupon', { token: tokens.user, body: { code: 'NOPE', amount: 100 } })).status, 404);
  });

  it('blocks deleting a show that has confirmed bookings', async () => {
    const res = await request('DELETE', `/shows/${ids.futureShow}`, { token: tokens.admin });
    assert.equal(res.status, 409);
    assert.ok(await Show.exists({ _id: ids.futureShow }));
  });

  it('only lets the owner cancel, and frees the seats', async () => {
    assert.equal((await request('POST', `/bookings/${bookingId}/cancel`, { token: tokens.friend })).status, 404);

    const res = await request('POST', `/bookings/${bookingId}/cancel`, { token: tokens.user });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'cancelled');

    const show = await Show.findById(ids.futureShow);
    assert.deepEqual([...show.bookedSeats], []);

    assert.equal((await request('POST', `/bookings/${bookingId}/cancel`, { token: tokens.user })).status, 400);
  });

  it('deletes a show once it has no confirmed bookings', async () => {
    const res = await request('DELETE', `/shows/${ids.deletableShow}`, { token: tokens.admin });
    assert.equal(res.status, 200);
  });
});

describe('squads', () => {
  let squadId;
  let squadBookingId;

  it('creates a squad and invites a friend', async () => {
    const created = await request('POST', '/squads', { token: tokens.user, body: { name: 'Movie Night', city: 'Test City' } });
    assert.equal(created.status, 201);
    squadId = created.data._id;

    assert.equal((await request('POST', `/squads/${squadId}/invite`, { token: tokens.user, body: {} })).status, 400);
    assert.equal((await request('POST', `/squads/${squadId}/invite`, { token: tokens.user, body: { emails: ['not-an-email'] } })).status, 400);
    assert.equal((await request('POST', `/squads/${squadId}/invite`, { token: tokens.friend, body: { emails: ['x@test.dev'] } })).status, 403);

    const invited = await request('POST', `/squads/${squadId}/invite`, { token: tokens.user, body: { emails: ['FRIEND@test.dev'] } });
    assert.equal(invited.status, 200);
  });

  it('validates invite responses and lets the friend accept', async () => {
    assert.equal((await request('POST', `/squads/${squadId}/respond`, { token: tokens.friend, body: { status: 'hacked' } })).status, 400);
    const res = await request('POST', `/squads/${squadId}/respond`, { token: tokens.friend, body: { status: 'accepted' } });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'accepted');
  });

  it('hides the squad from people who are not part of it', async () => {
    assert.equal((await request('GET', `/squads/${squadId}`, { token: tokens.outsider })).status, 403);
    assert.equal((await request('GET', `/squads/${squadId}`, { token: tokens.friend })).status, 200);
  });

  it('recommends upcoming shows for the top-voted movie', async () => {
    assert.equal((await request('GET', '/squads/64b000000000000000000000/recommendations', { token: tokens.user })).status, 404);

    await request('PUT', `/squads/${squadId}/availability`, { token: tokens.friend, body: { movieVote: ids.movie, availability: ['Sat evening'] } });
    const res = await request('GET', `/squads/${squadId}/recommendations`, { token: tokens.user });
    assert.equal(res.status, 200);
    assert.equal(res.data.topMovieId, ids.movie);
    assert.equal(res.data.topSlot, 'Sat evening');
    assert.ok(res.data.shows.length > 0);
    assert.ok(res.data.shows.every((s) => new Date(s.showTime) > new Date()));
  });

  it('does not let outsiders book on behalf of the squad', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.outsider,
      body: { showId: ids.squadShow, seats: ['A1'], squadId }
    });
    assert.equal(res.status, 403);
    const show = await Show.findById(ids.squadShow);
    assert.deepEqual([...show.bookedSeats], []);
  });

  it('completes the squad when the host books, and notifies members', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.user,
      body: { showId: ids.squadShow, seats: ['C1', 'C2'], squadId }
    });
    assert.equal(res.status, 201);
    squadBookingId = res.data._id;

    const squad = await Squad.findById(squadId);
    assert.equal(squad.status, 'completed');
    assert.equal(squad.theater, 'Test Theatre');
    assert.equal(squad.bookingId.toString(), squadBookingId);

    const notes = await Notification.find({ userId: ids.friend });
    assert.equal(notes.length, 1);
    assert.match(notes[0].message, /Theatre: Test Theatre/);

    const shared = await request('GET', '/bookings/shared', { token: tokens.friend });
    assert.equal(shared.data.length, 1);
  });

  it('refuses a second booking for a completed squad', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.user,
      body: { showId: ids.squadShow, seats: ['C3'], squadId }
    });
    assert.equal(res.status, 400);
  });

  it('reopens the squad and notifies members when the booking is cancelled', async () => {
    const res = await request('POST', `/bookings/${squadBookingId}/cancel`, { token: tokens.user });
    assert.equal(res.status, 200);

    const squad = await Squad.findById(squadId);
    assert.equal(squad.status, 'gathering');
    assert.equal(squad.bookingId, undefined);
    assert.equal(squad.bookingRef, undefined);
    assert.equal(squad.theater, undefined);

    // Votes are kept so the group can book again straight away
    const friendMember = await SquadMember.findOne({ squadId, email: 'friend@test.dev' });
    assert.equal(friendMember.movieVote.toString(), ids.movie);

    const notes = await Notification.find({ userId: ids.friend }).sort({ createdAt: 1 });
    assert.equal(notes.length, 2);
    assert.equal(notes[1].type, 'squad_reopened');
    assert.equal(notes[1].link, `/squads/${squadId}`);

    const shared = await request('GET', '/bookings/shared', { token: tokens.friend });
    assert.equal(shared.data.length, 0);
  });

  it('lets the reopened squad book again', async () => {
    const res = await request('POST', '/bookings', {
      token: tokens.friend,
      body: { showId: ids.squadShow, seats: ['C1'], squadId }
    });
    assert.equal(res.status, 201);
    assert.equal((await Squad.findById(squadId)).status, 'completed');
  });
});

describe('notifications', () => {
  it('only marks your own notifications as read', async () => {
    const note = await Notification.findOne({ userId: ids.friend });
    assert.equal((await request('PUT', `/notifications/${note._id}/read`, { token: tokens.outsider })).status, 404);
    const res = await request('PUT', `/notifications/${note._id}/read`, { token: tokens.friend });
    assert.equal(res.status, 200);
    assert.equal(res.data.read, true);
  });
});
