const userRepository = require('../repositories/UserRepository');
const Boom = require('@hapi/boom');
const bcrypt = require('bcryptjs');

class UserService {
  async getAllUsers(filter = {}) {
    return await userRepository.findAll(filter);
  }

  async getUserById(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) throw Boom.notFound('User not found');
      return user;
    } catch (error) {
      if (error.name === 'CastError') throw Boom.badRequest('Invalid user ID format');
      throw error;
    }
  }

  async createUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) throw Boom.conflict('Email already exists');
    try {
      return await userRepository.create(userData);
    } catch (error) {
      if (error.name === 'ValidationError') throw Boom.badRequest(error.message);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const existing = await userRepository.findById(id);
      if (!existing) throw Boom.notFound('User not found');

      if (userData.email && userData.email !== existing.email) {
        const emailExists = await userRepository.findByEmail(userData.email);
        if (emailExists) throw Boom.conflict('Email already exists');
      }

      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 12);
      }

      const updated = await userRepository.update(id, userData);
      if (!updated) throw Boom.notFound('User not found');
      return updated;
    } catch (error) {
      if (error.name === 'CastError') throw Boom.badRequest('Invalid user ID format');
      if (error.name === 'ValidationError') throw Boom.badRequest(error.message);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) throw Boom.notFound('User not found');
      const deleted = await userRepository.delete(id);
      if (!deleted) throw Boom.internal('Failed to delete user');
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') throw Boom.badRequest('Invalid user ID format');
      throw error;
    }
  }
}

module.exports = new UserService();
