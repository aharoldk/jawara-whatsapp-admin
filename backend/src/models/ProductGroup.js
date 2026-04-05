import mongoose from 'mongoose';

const productGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model('ProductGroup', productGroupSchema);
