import Joi from 'joi';
import axios from 'axios';

const wahaHttp = axios.create({
  baseURL: process.env.WAHA_BASE_URL ?? 'http://localhost:3000',
  headers: { 'X-Api-Key': process.env.WAHA_API_KEY ?? '' },
});

const wahaRoute = {
  name: 'waha-proxy',
  version: '1.0.0',
  register(server) {
    // List sessions — falls back to synthesising the default session for WAHA Core
    const DEFAULT_SESSION = process.env.WAHA_SESSION ?? 'default';
    server.route({
      method: 'GET',
      path: '/waha/sessions',
      async handler() {
        const { data } = await wahaHttp.get('/api/sessions?all=true');
        // WAHA Core always returns [] from the sessions list endpoint;
        // fall back to querying the default session directly.
        if (Array.isArray(data) && data.length === 0) {
          try {
            const { data: session } = await wahaHttp.get(`/api/sessions/${DEFAULT_SESSION}`);
            return [session];
          } catch {
            // Session hasn't been created yet — return empty
            return [];
          }
        }
        return data;
      },
    });

    // Create session
    server.route({
      method: 'POST',
      path: '/waha/sessions',
      options: {
        validate: {
          payload: Joi.object({ name: Joi.string().required() }),
        },
      },
      async handler(request, h) {
        console.log(`Creating WAHA session "${process.env.WAHA_API_KEY}"...`);
        const { data } = await wahaHttp.post('/api/sessions', {
          name: "default",
          config: {},
        });
        return h.response(data).code(201);
      },
    });

    // Start session
    server.route({
      method: 'POST',
      path: '/waha/sessions/{name}/start',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request) {
        const { data } = await wahaHttp.post(`/api/sessions/${request.params.name}/start`);
        return data;
      },
    });

    // Restart session — stop then start, preserving stored auth so no new QR is needed
    server.route({
      method: 'POST',
      path: '/waha/sessions/{name}/restart',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request) {
        const { name } = request.params;
        try { await wahaHttp.post(`/api/sessions/${name}/stop`); } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 1000));
        const { data } = await wahaHttp.post(`/api/sessions/${name}/start`);
        return data ?? { status: 'restarted' };
      },
    });

    // Hard reset session — deletes auth storage, forces new QR scan
    server.route({
      method: 'POST',
      path: '/waha/sessions/{name}/reset',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request) {
        const { name } = request.params;
        try { await wahaHttp.delete(`/api/sessions/${name}`); } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 1500));
        await wahaHttp.post('/api/sessions', { name, config: {} });
        await new Promise((r) => setTimeout(r, 500));
        const { data } = await wahaHttp.post(`/api/sessions/${name}/start`);
        return data ?? { status: 'reset' };
      },
    });

    // Stop session
    server.route({
      method: 'POST',
      path: '/waha/sessions/{name}/stop',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request) {
        const { data } = await wahaHttp.post(`/api/sessions/${request.params.name}/stop`);
        return data;
      },
    });

    // Delete session (clears auth/storage so a fresh QR can be scanned)
    server.route({
      method: 'DELETE',
      path: '/waha/sessions/{name}',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request, h) {
        await wahaHttp.delete(`/api/sessions/${request.params.name}`);
        return h.response().code(204);
      },
    });

    // Get session me (connected account info)
    server.route({
      method: 'GET',
      path: '/waha/sessions/{name}/me',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request) {
        const { data } = await wahaHttp.get(`/api/${request.params.name}/auth/me`);
        return data;
      },
    });

    // Get QR code — fetches raw PNG via arraybuffer to avoid binary/UTF-8 corruption
    server.route({
      method: 'GET',
      path: '/waha/sessions/{name}/qr',
      options: {
        validate: { params: Joi.object({ name: Joi.string().required() }) },
      },
      async handler(request, h) {
        try {
          const { data } = await wahaHttp.get(
            `/api/${request.params.name}/auth/qr?format=image`,
            { responseType: 'arraybuffer' },
          );
          const base64 = Buffer.from(data).toString('base64');
          return { value: `data:image/png;base64,${base64}` };
        } catch (err) {
          const status = err.response?.status ?? 500;
          const msg = err.response?.data?.message ?? err.message;
          if (process.env.NODE_ENV !== 'production') {
            console.error(`[WAHA QR] ${request.params.name} → ${status}: ${msg}`);
          }
          return h.response({ error: msg }).code(status);
        }
      },
    });
  },
};

export default wahaRoute;
