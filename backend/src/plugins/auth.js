import Boom from '@hapi/boom';

const API_KEY = process.env.BACKEND_API_KEY;

const authPlugin = {
  name: 'api-key-auth',
  version: '1.0.0',
  register(server) {
    server.auth.scheme('api-key', () => ({
      authenticate(request, h) {
        const key = request.headers['x-api-key'];
        if (!key || key !== API_KEY) {
          throw Boom.unauthorized('Invalid or missing API key');
        }
        return h.authenticated({ credentials: { key } });
      },
    }));

    server.auth.strategy('default', 'api-key');
    server.auth.default('default');
  },
};

export default authPlugin;
