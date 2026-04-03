/**
 * Thin WAHA REST client — used by Phase 3 backend-initiated sends
 * (reminders, broadcast). Reads config from process.env.
 */
import axios from 'axios';

const BASE_URL = process.env.WAHA_BASE_URL ?? 'http://localhost:3000';
const API_KEY = process.env.WAHA_API_KEY ?? '';
const SESSION = process.env.WAHA_SESSION ?? 'default';

const wahaHttp = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-Api-Key': API_KEY },
});

/**
 * Build a WAHA chatId from a phone number string.
 * Strips any leading '+' and appends '@c.us'.
 * @param {string} phone  e.g. "+6281234567890" or "6281234567890"
 * @returns {string}  e.g. "6281234567890@c.us"
 */
export function toChatId(phone) {
  return `${phone.replace(/^\+/, '')}@c.us`;
}

/**
 * Send a plain-text message via WAHA.
 * @param {string} phone  Recipient phone number (with or without leading +)
 * @param {string} text   Message body
 * @param {string} [replyToId]  Optional message ID to reply to
 */
export async function sendText(phone, text, replyToId) {
  const body = {
    session: SESSION,
    chatId: toChatId(phone),
    text,
  };
  if (replyToId) body.reply_to = { id: replyToId };

  const { data } = await wahaHttp.post('/api/sendText', body);
  return data;
}

/**
 * Send a text message to multiple recipients (fire-and-forget, errors logged).
 * @param {string[]} phones
 * @param {string} text
 * @returns {{ sent: string[], failed: string[] }}
 */
export async function sendBulkText(phones, text) {
  const sent = [];
  const failed = [];

  for (const phone of phones) {
    try {
      await sendText(phone, text);
      sent.push(phone);
    } catch (err) {
      console.error(`sendBulkText failed for ${phone}:`, err.message);
      failed.push(phone);
    }
  }

  return { sent, failed };
}
