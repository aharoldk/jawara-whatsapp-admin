import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    recipientPhone: { type: String, required: true, index: true },
    message: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    sent: { type: Boolean, default: false, index: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('Reminder', reminderSchema);
