import axios from 'axios';

const wahaPlugin = {
  name: 'waha-session-manager',
  version: '1.0.0',
  async register(server) {
    const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? 'http://localhost:3000';
    const WAHA_API_KEY  = process.env.WAHA_API_KEY  ?? '';
    const WAHA_SESSION  = process.env.WAHA_SESSION  ?? 'default';

    const wahaHttp = axios.create({
      baseURL: WAHA_BASE_URL,
      headers: { 'X-Api-Key': WAHA_API_KEY },
    });

    // Start the session — safe to call even if it's already running
    async function startSession() {
      try {
        await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/start`);
        console.log(`WAHA: session "${WAHA_SESSION}" started`);
      } catch {
        // Ignore — session is likely already running
      }
    }

    // Wait for WAHA to be ready, then start session
    setTimeout(startSession, 5_000);

    // Health check every 30s: restart if not WORKING
    const healthInterval = setInterval(async () => {
      try {
        const { data: session } = await wahaHttp.get(`/api/sessions/${WAHA_SESSION}`);
        if (session?.status !== 'WORKING') {
          console.log(`WAHA health: session is "${session?.status}" — restarting...`);
          try { await wahaHttp.post(`/api/sessions/${WAHA_SESSION}/stop`); } catch { /* ignore */ }
          await startSession();
        }
      } catch (err) {
        console.warn(`WAHA health check: ${err.message}`);
      }
    }, 30_000);

    server.ext('onPreStop', () => clearInterval(healthInterval));
  },
};

export default wahaPlugin;
