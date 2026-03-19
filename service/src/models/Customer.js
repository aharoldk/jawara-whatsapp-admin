const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  tenantId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Tenant',
    required: true,
    index   : true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v.replace(/\s/g, ''));
      },
      message: props => `${props.value} is not a valid WhatsApp number!`
    }
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  // Data object: flexible customer metadata (sesuai desain)
  data: {
    ibukandung: { type: String, default: '' },
    npwp:       { type: String, default: '' },
    lastServiceDate: { type: Date, default: null },
    lastOrder:  { type: String, default: '' },
    vehicle:    { type: [String], default: [] },
    // Extra fields stored freely
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    default: ''
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

customerSchema.index({ whatsappNumber: 1 }, { unique: true });
customerSchema.index({ fullName: 'text' });
customerSchema.index({ status: 1 });
customerSchema.index({ tags: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual: WhatsApp chat ID format
customerSchema.virtual('whatsappId').get(function() {
  const cleaned = this.whatsappNumber.replace(/\D/g, '');
  return `${cleaned}@c.us`;
});

module.exports = mongoose.model('Customer', customerSchema);
