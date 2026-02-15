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
        throw new Error(`WAHA API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw Boom.internal('Failed to fetch WhatsApp sessions');
    }
  }

  /**
   * Start a new WhatsApp session
   */
  async startSession(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: sessionName,
          config: {
            webhooks: [
              {
                url: process.env.WHATSAPP_HOOK_URL || 'http://localhost:3000/api/webhooks/whatsapp',
                events: ['message', 'session.status']
              }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WAHA API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting session:', error);
      throw Boom.internal('Failed to start WhatsApp session');
    }
  }

  /**
   * Get QR code for session
   */
  async getQRCode(sessionName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/auth/qr`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`WAHA API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw Boom.internal('Failed to fetch QR code');
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
          session: sessionName,
          chatId: recipient,
          text: content
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WAHA API error: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw Boom.internal('Failed to send WhatsApp message');
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
        throw new Error(`WAHA API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping session:', error);
      throw Boom.internal('Failed to stop WhatsApp session');
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
        throw new Error(`WAHA API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session status:', error);
      throw Boom.internal('Failed to fetch session status');
    }
  }

  /**
   * Get headers for WAHA API requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    return headers;
  }
}

module.exports = new WahaService();

