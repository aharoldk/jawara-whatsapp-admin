const config = require('../config');
const Boom = require('@hapi/boom');

// Status WAHA yang dianggap "sudah berjalan" — tidak perlu start ulang
const RUNNING_STATUSES  = ['WORKING', 'CONNECTED', 'ONLINE'];
// Status yang stuck / butuh dibersihkan sebelum start ulang
const STUCK_STATUSES    = ['STARTING', 'SCAN_QR_CODE'];
// Status yang aman langsung di-start ulang
const STOPPED_STATUSES  = ['STOPPED', 'FAILED', 'LOGOUT'];

class WahaService {
  constructor() {
    this.baseUrl = config.whatsapp.apiUrl;
    this.apiKey  = config.whatsapp.apiKey;
  }

  // ─────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────

  async getSessions() {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error.message);
      throw Boom.internal(error.message);
    }
  }

  /**
   * Cek status session saat ini.
   * Return null jika session tidak ditemukan (404).
   */
  async getSessionStatus(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.status === 404) return null;

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session status:', error.message);
      throw Boom.internal(error.message);
    }
  }

  /**
   * Start session dengan logika anti-loop:
   *
   * 1. Cek apakah session sudah ada dan apa statusnya
   * 2. RUNNING       → return langsung, tidak perlu apa-apa
   * 3. STUCK         → stop dulu, tunggu sebentar, baru start ulang
   * 4. STOPPED/FAILED→ langsung start ulang
   * 5. Tidak ada     → buat baru
   */
  async startSession(sessionName) {
    try {
      const existing = await this.getSessionStatus(sessionName);

      // Session sudah terkoneksi dengan baik
      if (existing && RUNNING_STATUSES.includes(existing.status)) {
        console.log(`[Session] "${sessionName}" sudah RUNNING (${existing.status}), skip start`);
        return existing;
      }

      // Session stuck di STARTING / SCAN_QR_CODE
      // → harus stop dulu supaya WAHA reset state-nya
      if (existing && STUCK_STATUSES.includes(existing.status)) {
        console.log(`[Session] "${sessionName}" stuck di ${existing.status}, stop dulu...`);
        await this.stopSession(sessionName).catch(() => {}); // ignore error jika gagal stop
        await this._delay(1500); // beri WAHA waktu reset
      }

      // Session tidak ada → buat baru
      if (!existing) {
        console.log(`[Session] "${sessionName}" tidak ditemukan, membuat baru...`);
        const createRes = await fetch(`${this.baseUrl}/api/sessions`, {
          method : 'POST',
          headers: this.getHeaders(),
          body   : JSON.stringify({ name: sessionName })
        });

        // 422 = race condition, session dibuat di antara cek & create → resume saja
        if (createRes.status === 422) {
          console.log(`[Session] Race condition saat create "${sessionName}", langsung resume`);
          return await this._doStart(sessionName);
        }

        if (!createRes.ok) {
          const body = await createRes.text();
          throw new Error(`WAHA ${createRes.status}: ${body}`);
        }

        return await createRes.json();
      }

      // Session ada tapi STOPPED / FAILED → start ulang
      console.log(`[Session] "${sessionName}" status ${existing.status}, memulai ulang...`);
      return await this._doStart(sessionName);

    } catch (error) {
      console.error('Error starting session:', error.message);
      throw Boom.internal(error.message);
    }
  }

  /**
   * Force restart — stop → delete → buat ulang dari nol.
   * Gunakan saat session benar-benar stuck dan scan QR ulang diperlukan.
   */
  async forceRestartSession(sessionName) {
    try {
      console.log(`[Session] Force restart "${sessionName}"...`);

      // 1. Stop (ignore error)
      await this.stopSession(sessionName).catch(() => {});
      await this._delay(1000);

      // 2. Delete (ignore error jika tidak ada)
      await this._deleteSession(sessionName).catch(() => {});
      await this._delay(1000);

      // 3. Buat ulang dari nol
      const createRes = await fetch(`${this.baseUrl}/api/sessions`, {
        method : 'POST',
        headers: this.getHeaders(),
        body   : JSON.stringify({ name: sessionName })
      });

      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`WAHA ${createRes.status}: ${body}`);
      }

      const session = await createRes.json();
      console.log(`[Session] "${sessionName}" berhasil di-restart dari nol`);
      return session;

    } catch (error) {
      console.error('Error force restarting session:', error.message);
      throw Boom.internal(error.message);
    }
  }

  async stopSession(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/stop`, {
        method : 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping session:', error.message);
      throw Boom.internal(error.message);
    }
  }

  // ─────────────────────────────────────────────
  // QR CODE
  // ─────────────────────────────────────────────

  async getQRCode(sessionName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/${sessionName}/auth/qr?format=json`,
        { method: 'GET', headers: this.getHeaders() }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('image/')) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return { imageBase64: `data:${contentType};base64,${base64}` };
      }

      const json = await response.json();
      if (json.data && json.mime) {
        return { imageBase64: `data:${json.mime};base64,${json.data}` };
      }

      return json;
    } catch (error) {
      console.error('Error fetching QR code:', error.message);
      throw Boom.internal(error.message);
    }
  }

  // ─────────────────────────────────────────────
  // MESSAGING
  // ─────────────────────────────────────────────

  async sendTextMessage(sessionName, recipient, content) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sendText`, {
        method : 'POST',
        headers: this.getHeaders(),
        body   : JSON.stringify({
          session: sessionName || 'default',
          chatId : recipient,
          text   : content
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw Boom.internal(error.message);
    }
  }

  async sendImageMessage(sessionName, recipient, { url, base64, caption = '' }) {
    if (!url && !base64) {
      throw Boom.badRequest('Either url or base64 must be provided for image message');
    }

    try {
      const file = url ? { url } : { data: base64 };

      const response = await fetch(`${this.baseUrl}/api/sendImage`, {
        method : 'POST',
        headers: this.getHeaders(),
        body   : JSON.stringify({
          session: sessionName || 'default',
          chatId : recipient,
          file,
          caption
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending image:', error.message);
      throw Boom.internal(error.message);
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /** Panggil endpoint /start untuk resume session yang sudah ada */
  async _doStart(sessionName) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/start`, {
      method : 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WAHA ${response.status}: ${body}`);
    }

    return await response.json();
  }

  /** Hapus session dari WAHA sepenuhnya */
  async _deleteSession(sessionName) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}`, {
      method : 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WAHA ${response.status}: ${body}`);
    }

    return true;
  }

  /** Simple delay helper */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    return headers;
  }
}

module.exports = new WahaService();
