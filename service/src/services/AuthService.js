const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');
const User = require('../models/User');
const config = require('../config');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id || user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw Boom.unauthorized('Token expired');
      }
      throw Boom.unauthorized('Invalid token');
    }
  }

  async register({ name, email, password, phone, role }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw Boom.conflict('Email already registered');
    }
    const user = await User.create({ name, email, password, phone: phone || '', role: role || 'user' });
    const token = this.generateToken(user);
    return { user, token };
  }

  async login({ email, password }) {
    // Must select password explicitly (field has select:false)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw Boom.unauthorized('Invalid email or password');
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      throw Boom.unauthorized('Invalid email or password');
    }
    const token = this.generateToken(user);
    return { user, token };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw Boom.notFound('User not found');
    return user;
  }
}

module.exports = new AuthService();
