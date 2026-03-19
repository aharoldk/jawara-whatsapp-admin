const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  subdomain: {
    type    : String,
    required: true,
    unique  : true,
    trim    : true,
    lowercase: true,
    match   : [/^[a-z0-9-]+$/, 'Subdomain hanya boleh huruf kecil, angka, dan tanda hubung']
  },
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  businessType: {
    type   : String,
    trim   : true,
    default: ''   // "bengkel", "laundry", "toko", dll — bebas isi
  },
  status: {
    type   : String,
    enum   : ['active', 'suspended', 'trial'],
    default: 'active'
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

tenantSchema.index({ subdomain: 1 }, { unique: true });

module.exports = mongoose.model('Tenant', tenantSchema);
