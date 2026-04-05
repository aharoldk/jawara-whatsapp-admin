import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductGroup', required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs', trim: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
