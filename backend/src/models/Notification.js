import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'squad_completed' },
    read: { type: Boolean, default: false },
    link: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
