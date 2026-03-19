const userRepository = require('../repositories/UserRepository');
const Boom           = require('@hapi/boom');
const bcrypt         = require('bcryptjs');

class UserService {
  async getAllUsers(tenantId, filter = {}, options = {}) {
    return userRepository.findAll(tenantId, filter, options);
  }

  async getUserById(tenantId, id) {
    try {
      const user = await userRepository.findById(tenantId, id);
      if (!user) throw Boom.notFound('User tidak ditemukan');
      return user;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID user tidak valid');
      throw e;
    }
  }

  async createUser(tenantId, data) {
    const existing = await userRepository.findByEmail(tenantId, data.email);
    if (existing) throw Boom.conflict('Email sudah digunakan dalam tenant ini');
    try {
      return userRepository.create(tenantId, data);
    } catch (e) {
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async updateUser(tenantId, id, data) {
    try {
      const existing = await userRepository.findById(tenantId, id);
      if (!existing) throw Boom.notFound('User tidak ditemukan');
      if (data.email && data.email !== existing.email) {
        const dup = await userRepository.findByEmail(tenantId, data.email);
        if (dup) throw Boom.conflict('Email sudah digunakan');
      }
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
      }
      const updated = await userRepository.update(tenantId, id, data);
      if (!updated) throw Boom.notFound('User tidak ditemukan');
      return updated;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID user tidak valid');
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async deleteUser(tenantId, id, requesterId) {
    if (String(id) === String(requesterId))
      throw Boom.badRequest('Tidak dapat menghapus akun sendiri');
    try {
      const user = await userRepository.findById(tenantId, id);
      if (!user) throw Boom.notFound('User tidak ditemukan');
      await userRepository.delete(tenantId, id);
      return { message: 'User berhasil dihapus' };
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID user tidak valid');
      throw e;
    }
  }
}

module.exports = new UserService();
