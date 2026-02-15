const promotionSchedulerService = require('../services/PromotionSchedulerService');
const asyncHandler = require('../utils/asyncHandler');

const promotionSchedulerRoutes = [
  {
    method: 'GET',
    path: '/api/promotions',
    handler: asyncHandler(async (request, h) => {
      const { status, fromDate, toDate, recurringType, search, page, limit, sortBy, sortOrder } = request.query;

      const filter = {};
      if (status) filter.status = status;
      if (fromDate) filter.fromDate = fromDate;
      if (toDate) filter.toDate = toDate;
      if (recurringType) filter.recurringType = recurringType;
      if (search) filter.search = search;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: {}
      };

      if (sortBy) {
        options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        options.sort = { scheduledAt: 1 };
      }

      const result = await promotionSchedulerService.getAllPromotions(filter, options);
      return {
        success: true,
        data: result.promotions,
        pagination: result.pagination
      };
    })
  },
  {
    method: 'GET',
    path: '/api/promotions/{id}',
    handler: asyncHandler(async (request, h) => {
      const promotion = await promotionSchedulerService.getPromotionById(request.params.id);
      return {
        success: true,
        data: promotion
      };
    })
  },
  {
    method: 'GET',
    path: '/api/promotions/status/{status}',
    handler: asyncHandler(async (request, h) => {
      const promotions = await promotionSchedulerService.getPromotionsByStatus(request.params.status);
      return {
        success: true,
        data: promotions
      };
    })
  },
  {
    method: 'POST',
    path: '/api/promotions',
    handler: asyncHandler(async (request, h) => {
      const promotion = await promotionSchedulerService.createPromotion(request.payload);
      return h.response({
        success: true,
        data: promotion,
        message: 'Promotion scheduled successfully'
      }).code(201);
    })
  },
  {
    method: 'PUT',
    path: '/api/promotions/{id}',
    handler: asyncHandler(async (request, h) => {
      const promotion = await promotionSchedulerService.updatePromotion(request.params.id, request.payload);
      return {
        success: true,
        data: promotion,
        message: 'Promotion updated successfully'
      };
    })
  },
  {
    method: 'PATCH',
    path: '/api/promotions/{id}/cancel',
    handler: asyncHandler(async (request, h) => {
      const promotion = await promotionSchedulerService.cancelPromotion(request.params.id);
      return {
        success: true,
        data: promotion,
        message: 'Promotion cancelled successfully'
      };
    })
  },
  {
    method: 'DELETE',
    path: '/api/promotions/{id}',
    handler: asyncHandler(async (request, h) => {
      const result = await promotionSchedulerService.deletePromotion(request.params.id);
      return {
        success: true,
        message: result.message
      };
    })
  }
];

module.exports = promotionSchedulerRoutes;

