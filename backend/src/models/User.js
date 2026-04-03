import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in API responses
userSchema.set('toJSON', {
  transform(_, obj) {
    delete obj.password;
    return obj;
  },
});

export default mongoose.model('User', userSchema);
