import mongoose from 'mongoose';

const squadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['gathering', 'voting', 'ready', 'booking in progress', 'completed', 'cancelled', 'archived'],
      default: 'gathering',
    },
    // Automatic Completion fields
    movie: { type: String },
    theater: { type: String },
    showTime: { type: Date },
    bookingRef: { type: String },
    completionDate: { type: Date },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show' },
    attendeeCount: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model('Squad', squadSchema);
