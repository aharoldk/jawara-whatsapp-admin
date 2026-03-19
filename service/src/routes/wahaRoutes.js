const wahaService  = require('../services/WahaService');
const asyncHandler = require('../utils/asyncHandler');

const wahaRoutes = [
  {
    method: 'GET',
    path: '/api/whatsapp/sessions',
    handler: asyncHandler(async (request, h) => {
      const sessions = await wahaService.getSessions();
      return { success: true, data: sessions };
    })
  },

  {
    method: 'POST',
    path: '/api/whatsapp/sessions',
    handler: asyncHandler(async (request, h) => {
      const { name } = request.payload;
      const session  = await wahaService.startSession(name);
      return h.response({
        success: true,
        data   : session,
        message: 'WhatsApp session started successfully'
      }).code(201);
    })
  },

  {
    method: 'GET',
    path: '/api/whatsapp/sessions/{name}/qr',
    handler: asyncHandler(async (request, h) => {
      const qr = await wahaService.getQRCode(request.params.name);
      return { success: true, data: qr };
    })
  },

  {
    method: 'GET',
    path: '/api/whatsapp/sessions/{name}/status',
    handler: asyncHandler(async (request, h) => {
      const status = await wahaService.getSessionStatus(request.params.name);
      return { success: true, data: status };
    })
  },

  {
    method: 'POST',
    path: '/api/whatsapp/sessions/{name}/stop',
    handler: asyncHandler(async (request, h) => {
      const result = await wahaService.stopSession(request.params.name);
      return {
        success: true,
        data   : result,
        message: 'WhatsApp session stopped successfully'
      };
    })
  },

  /**
   * POST /api/whatsapp/sessions/{name}/force-restart
   * Stop → delete → create ulang. Untuk session yang stuck.
   */
  {
    method: 'POST',
    path: '/api/whatsapp/sessions/{name}/force-restart',
    handler: asyncHandler(async (request, h) => {
      const result = await wahaService.forceRestartSession(request.params.name);
      return h.response({
        success: true,
        data   : result,
        message: `Session "${request.params.name}" berhasil di-restart dari nol`
      }).code(200);
    })
  },

  {
    method: 'POST',
    path: '/api/whatsapp/send',
    handler: asyncHandler(async (request, h) => {
      const { session, recipient, content } = request.payload;
      const result = await wahaService.sendTextMessage(session, recipient, content);
      return h.response({
        success: true,
        data   : result,
        message: 'Message sent successfully'
      }).code(201);
    })
  },

  {
    method: 'POST',
    path: '/api/webhooks/whatsapp',
    handler: asyncHandler(async (request, h) => {
      const webhookData = request.payload;
      console.log('Received WhatsApp webhook:', JSON.stringify(webhookData, null, 2));
      return h.response({ success: true, message: 'Webhook received' }).code(200);
    })
  }
];

module.exports = wahaRoutes;
