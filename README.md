# Movie Booking MERN

A full-stack online movie ticket booking system built with MongoDB, Express, React, and Node.js.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Project Structure

```text
movie-booking-mern/
  backend/
    .env.example
    package.json
    src/
      config/db.js
      middleware/auth.js
      models/
      routes/
      seed.js
      server.js
  frontend/
    package.json
    index.html
    vite.config.js
    src/
      api.js
      App.jsx
      main.jsx
      styles.css
      components/
      pages/
```

## Setup

### 1. Backend

```bash
cd movie-booking-mern/backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Backend runs on `http://localhost:5000`.

Default seeded users:

```text
Admin: admin@example.com / admin123
User:  user@example.com / user123
```

### 2. Frontend

Open a second terminal:

```bash
cd movie-booking-mern/frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Features

- User registration and login
- JWT authentication
- Movie listing and movie detail pages
- Show timing selection
- Seat selection with live booked-seat blocking
- Booking confirmation and booking history
- Admin page to add movies and shows
- Seed data for quick testing

## Environment

Backend `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/movie_booking
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
