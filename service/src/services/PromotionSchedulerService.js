const promotionSchedulerRepository = require('../repositories/PromotionSchedulerRepository');
const customerRepository            = require('../repositories/CustomerRepository');
const Boom                          = require('@hapi/boom');

class PromotionSchedulerService {
  async getAllPromotions(tenantId, filter = {}, options = {}) {
    return promotionSchedulerRepository.findAll(tenantId, filter, options);
  }

  async getPromotionById(tenantId, id) {
    try {
      const p = await promotionSchedulerRepository.findById(tenantId, id);
      if (!p) throw Boom.notFound('Promosi tidak ditemukan');
      return p;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID promosi tidak valid');
      throw e;
    }
  }

  async createPromotion(tenantId, data) {
    try {
      if (new Date(data.scheduledAt) < new Date())
        throw Boom.badRequest('Waktu jadwal harus di masa depan');
      if (!data.customerFilter) data.customerFilter = { status: 'active' };
      if (!data.customerFilter.status) data.customerFilter.status = 'active';
      return promotionSchedulerRepository.create(tenantId, data);
    } catch (e) {
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async updatePromotion(tenantId, id, data) {
    try {
      const existing = await promotionSchedulerRepository.findById(tenantId, id);
      if (!existing) throw Boom.notFound('Promosi tidak ditemukan');
      if (['processing', 'completed'].includes(existing.status))
        throw Boom.badRequest('Promosi yang sedang berjalan atau sudah selesai tidak dapat diubah');
      const updated = await promotionSchedulerRepository.update(tenantId, id, data);
      if (!updated) throw Boom.notFound('Promosi tidak ditemukan');
      return updated;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID promosi tidak valid');
      throw e;
    }
  }

  async cancelPromotion(tenantId, id) {
    const existing = await promotionSchedulerRepository.findById(tenantId, id);
    if (!existing) throw Boom.notFound('Promosi tidak ditemukan');
    if (!['pending'].includes(existing.status))
      throw Boom.badRequest('Hanya promosi pending yang dapat dibatalkan');
    return promotionSchedulerRepository.updateStatus(tenantId, id, 'cancelled');
  }

  async deletePromotion(tenantId, id) {
    try {
      const existing = await promotionSchedulerRepository.findById(tenantId, id);
      if (!existing) throw Boom.notFound('Promosi tidak ditemukan');
      await promotionSchedulerRepository.delete(tenantId, id);
      return { message: 'Promosi berhasil dihapus' };
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID promosi tidak valid');
      throw e;
    }
  }
}

module.exports = new PromotionSchedulerService();
