const broadcastService   = require('../services/BroadcastService');
const customerRepository = require('../repositories/CustomerRepository');
const wahaService        = require('../services/WahaService');
const asyncHandler       = require('../utils/asyncHandler');
const Boom               = require('@hapi/boom');

const broadcastRoutes = [

  // ─────────────────────────────────────────────
  // POST /api/whatsapp/broadcast
  // Kirim broadcast ke list customer yang dipilih
  // ─────────────────────────────────────────────
  {
    method: 'POST',
    path: '/api/whatsapp/broadcast',
    handler: asyncHandler(async (request, h) => {
      const { sessions, customerIds, message, options } = request.payload;

      if (!Array.isArray(sessions) || sessions.length === 0) {
        throw Boom.badRequest('Minimal satu session diperlukan');
      }

      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        throw Boom.badRequest('Minimal satu customer diperlukan');
      }

      // Ambil data customer dari DB berdasarkan ID yang dipilih
      const customerDocs = await Promise.all(
        customerIds.map((id) => customerRepository.findById(id))
      );

      // Filter null (ID tidak ditemukan)
      const customers = customerDocs
        .filter(Boolean)
        .map((c) => ({
          chatId: c.whatsappId,   // virtual getter: "628xxx@c.us"
          name  : c.fullName
        }));

      if (customers.length === 0) {
        throw Boom.badRequest('Tidak ada customer valid yang ditemukan');
      }

      const result = await broadcastService.broadcastRichMessage(
        sessions,
        customers,
        message,
        options
      );

      return h.response({
        success: true,
        data   : result,
        message: `Broadcast selesai — ${result.summary.sent}/${result.summary.total} berhasil dikirim`
      }).code(200);
    })
  },

  // ─────────────────────────────────────────────
  // POST /api/whatsapp/broadcast/preview
  // Preview caption sebelum dikirim
  // ─────────────────────────────────────────────
  {
    method: 'POST',
    path: '/api/whatsapp/broadcast/preview',
    handler: asyncHandler(async (request, h) => {
      const { message, customer } = request.payload;

      const caption = broadcastService.buildCaption({
        text     : message.text,
        link     : message.link,
        linkLabel: message.linkLabel,
        customer : customer ?? { name: 'NamaCustomer' }
      });

      const captionVaried = broadcastService.varyMessage(caption);

      return {
        success: true,
        data   : {
          original: caption,
          varied  : captionVaried
        }
      };
    })
  },

  // ─────────────────────────────────────────────
  // GET /api/whatsapp/broadcast/customers
  // Ambil semua customer aktif untuk broadcast
  // ─────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/whatsapp/broadcast/customers',
    handler: asyncHandler(async (request, h) => {
      const { tag, search } = request.query;

      const filter = { status: 'active' };
      if (tag)    filter.tag    = tag;
      if (search) filter.search = search;

      const { customers } = await customerRepository.findAll(filter, {
        limit: 1000,
        sort : { fullName: 1 }
      });

      const mapped = customers.map((c) => ({
        id            : c.id,
        name          : c.fullName,
        whatsappNumber: c.whatsappNumber,
        chatId        : c.whatsappId,
        tags          : c.tags
      }));

      return {
        success: true,
        data   : mapped,
        total  : mapped.length
      };
    })
  },

  // ─────────────────────────────────────────────
  // GET /api/whatsapp/broadcast/sessions
  // Ambil session yang sedang CONNECTED
  // ─────────────────────────────────────────────
  {
    method: 'GET',
    path: '/api/whatsapp/broadcast/sessions',
    handler: asyncHandler(async (request, h) => {
      const sessions = await wahaService.getSessions();

      const connected = sessions.filter(
        (s) => s.status === 'WORKING' || s.status === 'CONNECTED'
      );

      return {
        success: true,
        data   : connected
      };
    })
  }
];

module.exports = broadcastRoutes;
