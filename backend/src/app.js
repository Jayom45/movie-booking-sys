import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import movieRoutes from './routes/movies.js';
import reviewRoutes from './routes/reviews.js';
import showRoutes from './routes/shows.js';
import adminRoutes from './routes/admin.js';
import squadRoutes from './routes/squads.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';

// Builds the Express app without connecting to the database or listening,
// so tests can start it on their own port against a test database.
export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/shows', showRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/squads', squadRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Return JSON for malformed request bodies, oversized uploads and any other unhandled error
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Uploaded file is too large' });
    }
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  });

  return app;
}
