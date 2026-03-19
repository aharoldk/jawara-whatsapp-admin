const mongoose = require('mongoose');

/**
 * Single-document settings store.
 * Seluruh konfigurasi sistem disimpan dalam satu dokumen dengan key 'main'.
 *
 * Structure:
 * {
 *   customerFieldTemplate: [
 *     { key, label, type, required, options, placeholder }
 *   ],
 *   broadcastDefaults: {
 *     baseDelayMs, jitterMs, pauseEvery, pauseDurationMs
 *   }
 * }
 */
const customerFieldSchema = new mongoose.Schema({
  key        : { type: String, required: true },  // e.g. "lastServiceDate"
  label      : { type: String, required: true },  // e.g. "Tanggal Service Terakhir"
  type       : {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'textarea'],
    default: 'text'
  },
  required   : { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  options    : [String],          // untuk type = 'select'
  order      : { type: Number, default: 0 }
}, { _id: false });

const broadcastDefaultsSchema = new mongoose.Schema({
  baseDelayMs    : { type: Number, default: 5000  },
  jitterMs       : { type: Number, default: 3000  },
  pauseEvery     : { type: Number, default: 20    },
  pauseDurationMs: { type: Number, default: 60000 }
}, { _id: false });

const settingSchema = new mongoose.Schema({
  tenantId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Tenant',
    required: true,
    unique  : true,
    index   : true
  },
  value: {
    customerFieldTemplate: [customerFieldSchema],
    broadcastDefaults    : { type: broadcastDefaultsSchema, default: () => ({}) }
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Setting', settingSchema);
