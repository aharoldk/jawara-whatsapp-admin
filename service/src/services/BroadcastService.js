const Boom = require('@hapi/boom');
const wahaService = require('./WahaService');

class BroadcastService {

  // ─────────────────────────────────────────────
  // CAPTION BUILDER
  // ─────────────────────────────────────────────

  buildCaption({ text, link, linkLabel, customer }) {
    const lines = [];

    if (customer?.name) {
      const greetings = [
        `Halo *${customer.name}* 👋`,
        `Hai *${customer.name}*!`,
        `Hei *${customer.name}* 😊`,
        `Hi Pelanggan Setia *${customer.name}*!`
      ];
      lines.push(greetings[Math.floor(Math.random() * greetings.length)]);
      lines.push('');
    }

    if (text) lines.push(text);

    if (link) {
      lines.push('');
      if (linkLabel) lines.push(`📎 ${linkLabel}`);
      lines.push(link);
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────
  // MESSAGE VARIATION (anti-spam)
  // ─────────────────────────────────────────────

  varyMessage(text) {
    const emojiVariants = [
      ['🔥', '⚡', '✨', '💥', '🎯'],
      ['👇', '⬇️', '📌', '👉', '➡️'],
      ['💬', '📣', '📢', '🗣️', '💡'],
      ['🛒', '🛍️', '🎁', '💝', '🎀']
    ];

    let varied = text;
    for (const variants of emojiVariants) {
      const current = variants.find((e) => varied.includes(e));
      if (current) {
        const next = variants[Math.floor(Math.random() * variants.length)];
        varied = varied.replace(current, next);
      }
    }

    varied += '\u200B'.repeat(Math.floor(Math.random() * 3) + 1);
    return varied;
  }

  // ─────────────────────────────────────────────
  // DELAY HELPERS
  // ─────────────────────────────────────────────

  async humanDelay(baseMs = 3000, jitterMs = 2000) {
    const jitter = (Math.random() * 2 - 1) * jitterMs;
    const delay  = Math.max(500, baseMs + jitter);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async longPause(durationMs, reason = 'checkpoint') {
    console.log(`[Broadcast] ⏸  ${reason} — pausing ${durationMs / 1000}s`);
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  // ─────────────────────────────────────────────
  // SINGLE MESSAGE SENDER
  // ─────────────────────────────────────────────

  async sendRichMessage(sessionName, recipient, payload) {
    const { text, link, linkLabel, customer, varyText = true } = payload;

    if (!text && !link) {
      throw Boom.badRequest('Minimal text atau link harus diisi');
    }

    let body = this.buildCaption({ text, link, linkLabel, customer });

    if (varyText) {
      body = this.varyMessage(body);
    }

    return wahaService.sendTextMessage(sessionName, recipient, body);
  }

  // ─────────────────────────────────────────────
  // BROADCAST ENGINE
  // ─────────────────────────────────────────────

  async broadcastRichMessage(sessions, customers, message, options = {}) {
    const {
      baseDelayMs     = 5000,
      jitterMs        = 3000,
      pauseEvery      = 20,
      pauseDurationMs = 60000,
      varyText        = true,
      personalize     = true
    } = options;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw Boom.badRequest('At least one session is required');
    }

    if (!Array.isArray(customers) || customers.length === 0) {
      throw Boom.badRequest('Customers must be a non-empty array');
    }

    const results = { success: [], failed: [] };
    let sessionIndex = 0;

    console.log(`[Broadcast] 🚀 Start — ${customers.length} recipients, ${sessions.length} session(s)`);

    for (let i = 0; i < customers.length; i++) {
      const customer    = customers[i];
      const sessionName = sessions[sessionIndex % sessions.length];

      if (i > 0 && i % pauseEvery === 0) {
        await this.longPause(pauseDurationMs, `message ${i}/${customers.length}`);
      }

      try {
        const result = await this.sendRichMessage(sessionName, customer.chatId, {
          ...message,
          customer: personalize ? { name: customer.name } : undefined,
          varyText
        });

        results.success.push({
          index    : i,
          recipient: customer.chatId,
          name     : customer.name,
          session  : sessionName,
          data     : result
        });

        console.log(`[Broadcast] ✓ ${i + 1}/${customers.length} → ${customer.chatId} (${sessionName})`);
      } catch (error) {
        results.failed.push({
          index    : i,
          recipient: customer.chatId,
          name     : customer.name,
          session  : sessionName,
          reason   : error.message
        });

        console.warn(`[Broadcast] ✗ ${i + 1}/${customers.length} → ${customer.chatId} — ${error.message}`);
      }

      sessionIndex++;

      if (i < customers.length - 1) {
        await this.humanDelay(baseDelayMs, jitterMs);
      }
    }

    const summary = {
      total        : customers.length,
      sent         : results.success.length,
      failed       : results.failed.length,
      sessions_used: sessions.length
    };

    console.log('[Broadcast] ✅ Done —', summary);

    return { ...results, summary };
  }
}

module.exports = new BroadcastService();
