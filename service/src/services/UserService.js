const userRepository = require('../repositories/UserRepository');
const Boom = require('@hapi/boom');

class UserService {
  async getAllUsers() {
    return await userRepository.findAll();
  }

  async getUserById(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw Boom.notFound('User not found');
      }
      return user;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid user ID format');
      }
      throw error;
    }
  }

  async createUser(userData) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw Boom.conflict('Email already exists');
    }

    try {
      return await userRepository.create(userData);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const existingUser = await userRepository.findById(id);
      if (!existingUser) {
        throw Boom.notFound('User not found');
      }

      // If email is being updated, check for duplicates
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await userRepository.findByEmail(userData.email);
        if (emailExists) {
          throw Boom.conflict('Email already exists');
        }
      }

      const updated = await userRepository.update(id, userData);
      if (!updated) {
        throw Boom.notFound('User not found');
      }

      return updated;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid user ID format');
      }
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw Boom.notFound('User not found');
      }

      const deleted = await userRepository.delete(id);
      if (!deleted) {
        throw Boom.internal('Failed to delete user');
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid user ID format');
      }
      throw error;
    }
  }
}

module.exports = new UserService();

