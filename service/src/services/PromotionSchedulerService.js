const promotionSchedulerRepository = require('../repositories/PromotionSchedulerRepository');
const customerRepository = require('../repositories/CustomerRepository');
const Boom = require('@hapi/boom');

class PromotionSchedulerService {
  async getAllPromotions(filter = {}, options = {}) {
    return await promotionSchedulerRepository.findAll(filter, options);
  }

  async getPromotionById(id) {
    try {
      const promotion = await promotionSchedulerRepository.findById(id);
      if (!promotion) {
        throw Boom.notFound('Promotion schedule not found');
      }
      return promotion;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid promotion ID format');
      }
      throw error;
    }
  }

  async getPromotionsByStatus(status) {
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw Boom.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return await promotionSchedulerRepository.findByStatus(status);
  }

  async createPromotion(promotionData) {
    try {
      // Validate scheduled time is in the future
      const scheduledAt = new Date(promotionData.scheduledAt);
      if (scheduledAt < new Date()) {
        throw Boom.badRequest('Scheduled time must be in the future');
      }

      // Set default customer filter if not provided
      if (!promotionData.customerFilter) {
        promotionData.customerFilter = {
          status: 'active' // Default to active customers only
        };
      }

      // If no specific status filter, include both active and inactive
      if (!promotionData.customerFilter.status) {
        promotionData.customerFilter.status = 'active';
      }

      return await promotionSchedulerRepository.create(promotionData);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async updatePromotion(id, promotionData) {
    try {
      const existing = await promotionSchedulerRepository.findById(id);
      if (!existing) {
        throw Boom.notFound('Promotion schedule not found');
      }

      // Don't allow updating if already processing or completed
      if (['processing', 'completed'].includes(existing.status)) {
        throw Boom.badRequest(`Cannot update promotion with status: ${existing.status}`);
      }

      // Validate scheduled time if being updated
      if (promotionData.scheduledAt) {
        const scheduledAt = new Date(promotionData.scheduledAt);
        if (scheduledAt < new Date()) {
          throw Boom.badRequest('Scheduled time must be in the future');
        }
      }

      const updated = await promotionSchedulerRepository.update(id, promotionData);
      if (!updated) {
        throw Boom.notFound('Promotion schedule not found');
      }

      return updated;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid promotion ID format');
      }
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async cancelPromotion(id) {
    try {
      const existing = await promotionSchedulerRepository.findById(id);
      if (!existing) {
        throw Boom.notFound('Promotion schedule not found');
      }

      if (['processing', 'completed'].includes(existing.status)) {
        throw Boom.badRequest(`Cannot cancel promotion with status: ${existing.status}`);
      }

      return await promotionSchedulerRepository.updateStatus(id, 'cancelled');
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid promotion ID format');
      }
      throw error;
    }
  }

  async deletePromotion(id) {
    try {
      const promotion = await promotionSchedulerRepository.findById(id);
      if (!promotion) {
        throw Boom.notFound('Promotion schedule not found');
      }

      // Only allow deletion if pending or cancelled
      if (!['pending', 'cancelled', 'failed'].includes(promotion.status)) {
        throw Boom.badRequest('Can only delete pending, cancelled, or failed promotions');
      }

      const deleted = await promotionSchedulerRepository.delete(id);
      if (!deleted) {
        throw Boom.internal('Failed to delete promotion schedule');
      }

      return { message: 'Promotion schedule deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid promotion ID format');
      }
      throw error;
    }
  }

  async getPendingSchedules() {
    return await promotionSchedulerRepository.findPendingSchedules();
  }
}

module.exports = new PromotionSchedulerService();

