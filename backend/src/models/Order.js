import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    clientPhone: { type: String, required: true, index: true },
    clientName: { type: String, default: '' },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compute totalAmount before saving if not set
orderSchema.pre('save', function () {
  if (this.items.length > 0 && this.totalAmount === 0) {
    this.totalAmount = this.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  }
});

export default mongoose.model('Order', orderSchema);
