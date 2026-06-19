import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theater: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    screen: { type: String, required: true, trim: true },
    showTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    bookedSeats: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model('Show', showSchema);
