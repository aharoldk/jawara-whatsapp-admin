import mongoose from 'mongoose';

const broadcastListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    recipientPhones: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('BroadcastList', broadcastListSchema);
