const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  whatsappNo: {
    type: String,
    required: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        // Validate WhatsApp number format (basic validation)
        return /^\+?[1-9]\d{1,14}$/.test(v.replace(/\s/g, ''));
      },
      message: props => `${props.value} is not a valid WhatsApp number!`
    }
  },
  address: {
    type: String,
    trim: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  lastContactedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
customerSchema.index({ whatsappNo: 1 }, { unique: true });
customerSchema.index({ name: 'text' });
customerSchema.index({ status: 1 });
customerSchema.index({ tags: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual for formatted WhatsApp ID
customerSchema.virtual('whatsappId').get(function() {
  // Convert phone number to WhatsApp ID format
  const cleaned = this.whatsappNo.replace(/\D/g, '');
  return `${cleaned}@c.us`;
});

module.exports = mongoose.model('Customer', customerSchema);

