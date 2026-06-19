import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: { type: String, required: true },
    language: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    posterUrl: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Movie', movieSchema);
