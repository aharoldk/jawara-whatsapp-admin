const reminderRepository  = require('../repositories/ReminderRepository');
const customerRepository  = require('../repositories/CustomerRepository');
const Boom                = require('@hapi/boom');

class ReminderService {
  async getAllReminders(tenantId, filter = {}, options = {}) {
    return reminderRepository.findAll(tenantId, filter, options);
  }

  async getReminderById(tenantId, id) {
    try {
      const r = await reminderRepository.findById(tenantId, id);
      if (!r) throw Boom.notFound('Reminder tidak ditemukan');
      return r;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID reminder tidak valid');
      throw e;
    }
  }

  async createReminder(tenantId, data) {
    try {
      this.validateQueryConditions(data.queryConditions);
      this.validateMessageTemplate(data.message);
      data.nextRun = this.calculateNextRun(data.executeAt, data.frequency);
      return reminderRepository.create(tenantId, data);
    } catch (e) {
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async updateReminder(tenantId, id, data) {
    try {
      const existing = await reminderRepository.findById(tenantId, id);
      if (!existing) throw Boom.notFound('Reminder tidak ditemukan');
      if (data.queryConditions) this.validateQueryConditions(data.queryConditions);
      if (data.message) this.validateMessageTemplate(data.message);
      if (data.executeAt || data.frequency) {
        data.nextRun = this.calculateNextRun(
          data.executeAt || existing.executeAt,
          data.frequency || existing.frequency
        );
      }
      const updated = await reminderRepository.update(tenantId, id, data);
      if (!updated) throw Boom.notFound('Reminder tidak ditemukan');
      return updated;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID reminder tidak valid');
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async updateReminderStatus(tenantId, id, status) {
    const valid = ['active', 'inactive', 'paused'];
    if (!valid.includes(status)) throw Boom.badRequest(`Status harus salah satu: ${valid.join(', ')}`);
    const existing = await reminderRepository.findById(tenantId, id);
    if (!existing) throw Boom.notFound('Reminder tidak ditemukan');
    return reminderRepository.updateStatus(tenantId, id, status);
  }

  async deleteReminder(tenantId, id) {
    try {
      const r = await reminderRepository.findById(tenantId, id);
      if (!r) throw Boom.notFound('Reminder tidak ditemukan');
      await reminderRepository.delete(tenantId, id);
      return { message: 'Reminder berhasil dihapus' };
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID reminder tidak valid');
      throw e;
    }
  }

  async testQueryConditions(tenantId, id) {
    const reminder = await reminderRepository.findById(tenantId, id);
    if (!reminder) throw Boom.notFound('Reminder tidak ditemukan');
    const parsed    = this.parseQueryConditions(reminder.queryConditions);
    const result    = await customerRepository.findAll(tenantId, parsed, { limit: 10000 });
    return {
      totalMatching  : result.customers.length,
      queryConditions: reminder.queryConditions,
      sampleCustomers: result.customers.slice(0, 5).map(c => ({ id: c.id, name: c.fullName }))
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  parseQueryConditions(qc) {
    const parsed = JSON.parse(JSON.stringify(qc));
    const replace = (obj) => {
      for (const k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== null) replace(obj[k]);
        else if (typeof obj[k] === 'string') obj[k] = this.parseDatePlaceholder(obj[k]);
      }
    };
    replace(parsed);
    return parsed;
  }

  parseDatePlaceholder(value) {
    if (typeof value !== 'string') return value;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (value === 'TODAY')     return today.toISOString();
    if (value === 'YESTERDAY') { const d = new Date(today); d.setDate(d.getDate() - 1); return d.toISOString(); }
    if (value === 'TOMORROW')  { const d = new Date(today); d.setDate(d.getDate() + 1); return d.toISOString(); }
    const m = value.match(/^DATE_(MINUS|PLUS)_(\d+)$/);
    if (m) {
      const d = new Date(today);
      d.setDate(d.getDate() + (m[1] === 'MINUS' ? -parseInt(m[2]) : parseInt(m[2])));
      return d.toISOString();
    }
    return value;
  }

  calculateNextRun(executeAt, frequency) {
    const [h, m] = executeAt.split(':').map(Number);
    const now = new Date();
    const next = new Date(); next.setHours(h, m, 0, 0);
    if (next <= now) {
      if (frequency === 'daily')   next.setDate(next.getDate() + 1);
      if (frequency === 'weekly')  next.setDate(next.getDate() + 7);
      if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  calculateNextRunAfterExecution(currentRun, frequency) {
    const next = new Date(currentRun);
    if (frequency === 'daily')   next.setDate(next.getDate() + 1);
    if (frequency === 'weekly')  next.setDate(next.getDate() + 7);
    if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    return next;
  }

  validateQueryConditions(qc) {
    if (!qc || typeof qc !== 'object') throw Boom.badRequest('queryConditions harus berupa object');
  }

  validateMessageTemplate(msg) {
    if (!msg?.trim()) throw Boom.badRequest('Pesan tidak boleh kosong');
  }
}

module.exports = new ReminderService();
