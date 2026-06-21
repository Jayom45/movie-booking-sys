import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: [{ type: String, required: true }],
    seatDetails: [{
      number: String,
      category: String,
      price: Number
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    bookingRef: { type: String }
  },
  { timestamps: true }
);

// Sparse index: only documents that have bookingRef are included,
// so legacy bookings without this field don't cause duplicate-key errors.
bookingSchema.index({ bookingRef: 1 }, { unique: true, sparse: true });

export default mongoose.model('Booking', bookingSchema);

