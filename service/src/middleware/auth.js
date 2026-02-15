const Boom = require('@hapi/boom');

// Authentication middleware for Hapi
const authenticate = {
  name: 'authenticate',
  version: '1.0.0',
  register: async (server, options) => {
    server.ext('onPreAuth', (request, h) => {
      // Skip authentication for health check and root routes
      if (request.path === '/' || request.path === '/api/health') {
        return h.continue;
      }

      const token = request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw Boom.unauthorized('Authentication required');
      }

      // TODO: Verify JWT token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // request.app.user = decoded;

      // For now, just pass through
      request.app.user = { id: '1', role: 'admin' };

      return h.continue;
    });
  }
};

module.exports = { authenticate };

