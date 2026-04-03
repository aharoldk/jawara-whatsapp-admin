import mongoose from 'mongoose';

const broadcastJobSchema = new mongoose.Schema(
  {
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'BroadcastList', required: true },
    message: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'sending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('BroadcastJob', broadcastJobSchema);
