import mongoose from 'mongoose';

const squadMemberSchema = new mongoose.Schema(
  {
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    availability: [{ type: String }],
    movieVote: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('SquadMember', squadMemberSchema);
