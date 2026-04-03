import 'dotenv/config';
import Hapi from '@hapi/hapi';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import ordersRoute from './routes/orders.js';
import calendarRoute from './routes/calendar.js';
import reportsRoute from './routes/reports.js';
import remindersRoute from './routes/reminders.js';
import broadcastRoute from './routes/broadcast.js';

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
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response.isBoom) {
      const { statusCode, payload } = response.output;
      return h.response(JSON.parse(payload)).code(statusCode);
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

init();
