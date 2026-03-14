const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  queryConditions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  executeAt: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(v);
      },
      message: 'executeAt must be in HH:mm format (e.g., 09:00)'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused'],
    default: 'active',
    index: true
  },
  lastRun: {
    type: Date,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  nextRun: {
    type: Date,
    default: null,
    index: true
  },
  successCount: {
    type: Number,
    default: 0,
    min: 0
  },
  failureCount: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Indexes
reminderSchema.index({ status: 1, nextRun: 1 });
reminderSchema.index({ frequency: 1 });
reminderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reminder', reminderSchema);

