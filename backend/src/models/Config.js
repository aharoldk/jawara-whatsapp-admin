import mongoose from 'mongoose';

// Singleton config document — always upserted with _id = 'main'
const configSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'main' },
    knowledgeBase: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('Config', configSchema);
