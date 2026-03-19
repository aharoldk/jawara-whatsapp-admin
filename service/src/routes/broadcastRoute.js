const broadcastService  = require('../services/BroadcastService');
const customerRepository = require('../repositories/CustomerRepository');
const settingRepository  = require('../repositories/SettingRepository');
const wahaService        = require('../services/WahaService');
const asyncHandler       = require('../utils/asyncHandler');
const Boom               = require('@hapi/boom');

const broadcastRoutes = [
  {
    method: 'POST', path: '/api/whatsapp/broadcast',
    handler: asyncHandler(async (req, h) => {
      const tid = req.app.tenantId;
      const { sessions, customerIds, message, options } = req.payload;

      if (!Array.isArray(sessions) || sessions.length === 0)
        throw Boom.badRequest('Minimal satu session diperlukan');
      if (!Array.isArray(customerIds) || customerIds.length === 0)
        throw Boom.badRequest('Minimal satu customer diperlukan');

      const docs      = await Promise.all(customerIds.map(id => customerRepository.findById(tid, id)));
      const customers = docs.filter(Boolean).map(c => ({ chatId: c.whatsappId, name: c.fullName }));

      if (customers.length === 0) throw Boom.badRequest('Tidak ada customer valid');

      const settings      = await settingRepository.get(tid);
      const mergedOptions = { ...settings.broadcastDefaults, ...(options || {}) };

      const result = await broadcastService.broadcastRichMessage(sessions, customers, message, mergedOptions);
      return h.response({
        success: true, data: result,
        message: `Broadcast selesai — ${result.summary.sent}/${result.summary.total} berhasil`
      }).code(200);
    })
  },
  {
    method: 'POST', path: '/api/whatsapp/broadcast/preview',
    handler: asyncHandler(async (req, h) => {
      const { message, customer } = req.payload;
      const caption       = broadcastService.buildCaption({ ...message, customer: customer ?? { name: 'NamaCustomer' } });
      const captionVaried = broadcastService.varyMessage(caption);
      return { success: true, data: { original: caption, varied: captionVaried } };
    })
  },
  {
    method: 'GET', path: '/api/whatsapp/broadcast/customers',
    handler: asyncHandler(async (req, h) => {
      const { tag, search } = req.query;
      const filter = { status: 'active' };
      if (tag)    filter.tag    = tag;
      if (search) filter.search = search;
      const { customers } = await customerRepository.findAll(req.app.tenantId, filter, { limit: 1000, sort: { fullName: 1 } });
      const mapped = customers.map(c => ({ id: c.id, name: c.fullName, whatsappNumber: c.whatsappNumber, chatId: c.whatsappId, tags: c.tags }));
      return { success: true, data: mapped, total: mapped.length };
    })
  },
  {
    method: 'GET', path: '/api/whatsapp/broadcast/sessions',
    handler: asyncHandler(async (req, h) => {
      const sessions  = await wahaService.getSessions();
      const connected = sessions.filter(s => ['WORKING', 'CONNECTED'].includes(s.status));
      return { success: true, data: connected };
    })
  }
];

module.exports = broadcastRoutes;
