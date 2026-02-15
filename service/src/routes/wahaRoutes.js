const wahaService = require('../services/WahaService');
const asyncHandler = require('../utils/asyncHandler');

const wahaRoutes = [
  {
    method: 'GET',
    path: '/api/whatsapp/sessions',
    handler: asyncHandler(async (request, h) => {
      const sessions = await wahaService.getSessions();
      return {
        success: true,
        data: sessions
      };
    })
  },
  {
    method: 'POST',
    path: '/api/whatsapp/sessions',
    handler: asyncHandler(async (request, h) => {
      const { name } = request.payload;
      const session = await wahaService.startSession(name);
      return h.response({
        success: true,
        data: session,
        message: 'WhatsApp session started successfully'
      }).code(201);
    })
  },
  {
    method: 'GET',
    path: '/api/whatsapp/sessions/{name}/qr',
    handler: asyncHandler(async (request, h) => {
      const qr = await wahaService.getQRCode(request.params.name);
      return {
        success: true,
        data: qr
      };
    })
  },
  {
    method: 'GET',
    path: '/api/whatsapp/sessions/{name}/status',
    handler: asyncHandler(async (request, h) => {
      const status = await wahaService.getSessionStatus(request.params.name);
      return {
        success: true,
        data: status
      };
    })
  },
  {
    method: 'POST',
    path: '/api/whatsapp/sessions/{name}/stop',
    handler: asyncHandler(async (request, h) => {
      const result = await wahaService.stopSession(request.params.name);
      return {
        success: true,
        data: result,
        message: 'WhatsApp session stopped successfully'
      };
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
        data: result,
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

      // TODO: Process webhook data
      // - Store messages in database
      // - Update session status
      // - Trigger automated responses

      return h.response({
        success: true,
        message: 'Webhook received'
      }).code(200);
    })
  }
];

module.exports = wahaRoutes;

