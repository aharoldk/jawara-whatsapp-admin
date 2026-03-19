const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  tenantId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Tenant',
    required: true,
    index   : true
  },
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  email: {
    type     : String,
    required : true,
    lowercase: true,
    trim     : true
  },
  password: {
    type     : String,
    required : true,
    minlength: 6,
    select   : false
  },
  phone: {
    type   : String,
    trim   : true,
    default: ''
  },
  role: {
    type   : String,
    enum   : ['owner', 'staff'],
    default: 'staff'
  },
  isActive: {
    type   : Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Email unik per tenant (bukan global)
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
