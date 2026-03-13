const Boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Public paths that don't need authentication
const PUBLIC_PATHS = [
  '/',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/webhooks/whatsapp'
];

const authenticate = {
  name: 'authenticate',
  version: '1.0.0',
  register: async (server, options) => {
    server.ext('onPreAuth', (request, h) => {
      if (PUBLIC_PATHS.includes(request.path)) {
        return h.continue;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw Boom.unauthorized('Authentication required. Please provide a Bearer token.');
      }

      const token = authHeader.replace('Bearer ', '').trim();

      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        request.app.user = decoded;
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
