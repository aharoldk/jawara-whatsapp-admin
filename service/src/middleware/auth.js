const Boom   = require('@hapi/boom');
const jwt    = require('jsonwebtoken');
const config = require('../config');

const PUBLIC_PATHS = [
  '/',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register-tenant',
  '/api/webhooks/whatsapp'
];

const authenticate = {
  name   : 'authenticate',
  version: '1.0.0',
  register: async (server) => {
    server.ext('onPreAuth', (request, h) => {
      if (PUBLIC_PATHS.includes(request.path)) return h.continue;

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw Boom.unauthorized('Authentication required');
      }

      const token = authHeader.replace('Bearer ', '').trim();

      try {
        const decoded = jwt.verify(token, config.jwt.secret);

        // Inject ke request.app — tersedia di semua handler
        request.app.user      = decoded;
        request.app.tenantId  = decoded.tenantId;
        request.app.subdomain = decoded.subdomain;

        return h.continue;
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          throw Boom.unauthorized('Token expired. Please login again.');
        }
        throw Boom.unauthorized('Invalid token. Please login again.');
      }
    });
  }
};

module.exports = { authenticate };
