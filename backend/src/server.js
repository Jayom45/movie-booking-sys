import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in environment variables');
  process.exit(1);
}

const app = createApp();
const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
