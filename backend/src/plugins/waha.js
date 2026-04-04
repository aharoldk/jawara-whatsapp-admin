import axios from 'axios';

const wahaPlugin = {
  name: 'waha-session-manager',
  version: '1.0.0',
  async register(server) {
    const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? 'http://localhost:3000';
    const WAHA_API_KEY = process.env.WAHA_API_KEY ?? '';
    const WAHA_SESSION = process.env.WAHA_SESSION ?? 'default';

    const wahaHttp = axios.create({
      baseURL: WAHA_BASE_URL,
      headers: { 'X-Api-Key': WAHA_API_KEY },
    });

    async function getSession(name) {
      try {
        const { data: sessions } = await wahaHttp.get('/api/sessions?all=true');
        // WAHA Core always returns [] — fall back to direct session query
        if (Array.isArray(sessions) && sessions.length > 0) {
          return sessions.find((s) => s.name === name) ?? null;
        }
        const { data } = await wahaHttp.get(`/api/sessions/${name}`);
        return data;
      } catch {
        return null;
      }
    }

    async function ensureSession() {
      const session = await getSession(WAHA_SESSION);
      console.log('WAHA: current session status:', session?.status ?? 'not found');
      if (!session) {
        // WAHA Core auto-creates the session via WHATSAPP_DEFAULT_SESSION env var.
        // If it's not found yet, WAHA is still starting up — the retry loop will catch it.
        throw new Error('session not found — WAHA may still be initialising');
      }
      if (session.status === 'FAILED' || session.status === 'STOPPED') {
        console.log(`WAHA: session "${WAHA_SESSION}" is ${session.status} — restarting (preserving auth)...`);
        try { await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/stop`); } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 1000));
        await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/start`);
        console.log(`WAHA: session "${WAHA_SESSION}" restarted`);
      } else {
        console.log(`WAHA: session "${WAHA_SESSION}" is ${session.status}`);
      }
    }

    async function ensureSessionWithRetry(attempts = 3, delay = 5000) {
      for (let i = 1; i <= attempts; i++) {
        await new Promise((r) => setTimeout(r, delay));
        try {
          await ensureSession();
          return;
        } catch (err) {
          console.warn(`WAHA startup attempt ${i}/${attempts}: ${err.message}`);
        }
      }
    }

    ensureSessionWithRetry();

    // Periodic health check — restart any FAILED session every 30s (without deleting auth)
    const healthInterval = setInterval(async () => {
      try {
        const session = await getSession(WAHA_SESSION);
        if (session?.status === 'FAILED') {
          console.log(`WAHA health: session "${WAHA_SESSION}" FAILED — restarting (preserving auth)...`);
          try { await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/stop`); } catch { /* ignore */ }
          await new Promise((r) => setTimeout(r, 1000));
          await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/start`);
          console.log(`WAHA health: session "${WAHA_SESSION}" restarted`);
        } else if (session?.status === 'STOPPED') {
          console.log(`WAHA health: session "${WAHA_SESSION}" STOPPED — starting...`);
          await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/start`);
          console.log(`WAHA health: session "${WAHA_SESSION}" started`);
        }
      } catch (err) {
        console.warn(`WAHA health check: ${err.message}`);
      }
    }, 30_000);

    server.ext('onPreStop', () => {
      clearInterval(healthInterval);
    });
  },
};

export default wahaPlugin;
