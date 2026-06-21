import mongoose from 'mongoose';

const squadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['gathering', 'ready', 'booked', 'cancelled'],
      default: 'gathering',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Squad', squadSchema);
