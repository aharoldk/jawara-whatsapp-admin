import 'dotenv/config';
import Hapi from '@hapi/hapi';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import wahaSessionPlugin from './plugins/waha.js';
import ordersRoute from './routes/orders.js';
import calendarRoute from './routes/calendar.js';
import reportsRoute from './routes/reports.js';
import remindersRoute from './routes/reminders.js';
import broadcastRoute from './routes/broadcast.js';
import usersRoute from './routes/users.js';
import wahaRoute from './routes/waha.js';
import productGroupsRoute from './routes/productGroups.js';
import productsRoute from './routes/products.js';
import docsRoute from './routes/docs.js';

const server = Hapi.server({
  port: process.env.PORT ?? 4000,
  host: '0.0.0.0',
  routes: {
    cors: { origin: ['*'] },
    validate: {
      failAction: async (_req, _h, err) => { throw err; },
    },
  },
});

async function init() {
  await server.register(dbPlugin);
  await server.register(authPlugin);
  await server.register(wahaSessionPlugin);

  // Health check (public)
  server.route({
    method: 'GET',
    path: '/health',
    options: { auth: false },
    handler: () => ({ status: 'ok', timestamp: new Date().toISOString() }),
  });

  // Protected routes
  await server.register([
    ordersRoute,
    calendarRoute,
    reportsRoute,
    remindersRoute,
    broadcastRoute,
    usersRoute,
    wahaRoute,
    productGroupsRoute,
    productsRoute,
    docsRoute,
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response.isBoom) {
      const { statusCode, payload } = response.output;
      const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[${request.method.toUpperCase()}] ${request.path} → ${statusCode}`, body);
        if (response.stack) console.error(response.stack);
      }
      return h.response(body).code(statusCode);
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}, stopping server...`);
  await server.stop({ timeout: 5000 });
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

init();
