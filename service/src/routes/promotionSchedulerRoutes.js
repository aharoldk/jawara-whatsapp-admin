const promotionService = require('../services/PromotionSchedulerService');
const asyncHandler     = require('../utils/asyncHandler');

const promotionSchedulerRoutes = [
  {
    method: 'GET', path: '/api/promotions',
    handler: asyncHandler(async (req, h) => {
      const tid = req.app.tenantId;
      const { status, search, page, limit } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (search) filter.search = search;
      const result = await promotionService.getAllPromotions(tid, filter, {
        page: parseInt(page) || 1, limit: parseInt(limit) || 10
      });
      return { success: true, data: result.promotions, pagination: result.pagination };
    })
  },
  {
    method: 'GET', path: '/api/promotions/{id}',
    handler: asyncHandler(async (req, h) => {
      const p = await promotionService.getPromotionById(req.app.tenantId, req.params.id);
      return { success: true, data: p };
    })
  },
  {
    method: 'POST', path: '/api/promotions',
    handler: asyncHandler(async (req, h) => {
      const p = await promotionService.createPromotion(req.app.tenantId, req.payload);
      return h.response({ success: true, data: p, message: 'Promosi dijadwalkan' }).code(201);
    })
  },
  {
    method: 'PUT', path: '/api/promotions/{id}',
    handler: asyncHandler(async (req, h) => {
      const p = await promotionService.updatePromotion(req.app.tenantId, req.params.id, req.payload);
      return { success: true, data: p, message: 'Promosi diperbarui' };
    })
  },
  {
    method: 'PATCH', path: '/api/promotions/{id}/cancel',
    handler: asyncHandler(async (req, h) => {
      const p = await promotionService.cancelPromotion(req.app.tenantId, req.params.id);
      return { success: true, data: p, message: 'Promosi dibatalkan' };
    })
  },
  {
    method: 'DELETE', path: '/api/promotions/{id}',
    handler: asyncHandler(async (req, h) => {
      const result = await promotionService.deletePromotion(req.app.tenantId, req.params.id);
      return { success: true, message: result.message };
    })
  }
];

module.exports = promotionSchedulerRoutes;
