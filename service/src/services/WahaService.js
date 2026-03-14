const config = require('../config');
const Boom = require('@hapi/boom');

class WahaService {
  constructor() {
    this.baseUrl = config.whatsapp.apiUrl;
    this.apiKey = config.whatsapp.apiKey;
  }

  /**
   * Get all WhatsApp sessions
   */
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
   * Start a new WhatsApp session.
   * WAHA returns 422 when a session with the same name already exists.
   * In that case we fall back to the /start endpoint to resume the existing session.
   */
  async startSession(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name: sessionName })
      });

      // 422 = session already exists → try to start (resume) the existing one
      if (response.status === 422) {
        console.log(`Session "${sessionName}" already exists, attempting to start it...`);
        return await this.resumeSession(sessionName);
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`WAHA ${response.status}: ${body}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting session:', error.message);
      throw Boom.internal(error.message);
    }
  }

  /**
   * Resume / re-start an existing stopped session
   */
  async resumeSession(sessionName) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/start`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WAHA ${response.status}: ${body}`);
    }

    return await response.json();
  }

  /**
   * Get QR code for session
   */
  async getQRCode(sessionName) {
      try {
        // Request JSON format explicitly so we always get { mime, data } back
        const response = await fetch(
          `${this.baseUrl}/api/${sessionName}/auth/qr?format=json`,
          { method: 'GET', headers: this.getHeaders() }
        );
  
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`WAHA ${response.status}: ${body}`);
        }
  
        const contentType = response.headers.get('content-type') || '';
  
        // If WAHA still returns image binary (older versions ignore format param)
        if (contentType.includes('image/')) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return { imageBase64: `data:${contentType};base64,${base64}` };
        }
  
        // Normal JSON response: { mime: 'image/png', data: '<base64string>' }
        const json = await response.json();
        // Normalise to imageBase64 so frontend has one consistent field to read
        if (json.data && json.mime) {
          return { imageBase64: `data:${json.mime};base64,${json.data}` };
        }
  
        return json;
      } catch (error) {
        console.error('Error fetching QR code:', error.message);
        throw Boom.internal(error.message);
      }
    }

  /**
   * Send text message
   */
  async sendTextMessage(sessionName, recipient, content) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sendText`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          session: sessionName || 'default',
          chatId: recipient,
          text: content
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

  /**
   * Stop session
   */
  async stopSession(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/stop`, {
        method: 'POST',
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

  /**
   * Get session status
   */
  async getSessionStatus(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

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
   * Build request headers — always includes X-Api-Key when configured
   */
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    return headers;
  }
}

module.exports = new WahaService();

