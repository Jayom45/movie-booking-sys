import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

// Enforce one review per user per movie at the database level
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
