const reminderRepository = require('../repositories/ReminderRepository');
const customerRepository = require('../repositories/CustomerRepository');
const Boom = require('@hapi/boom');

class ReminderService {
  async getAllReminders(filter = {}, options = {}) {
    return await reminderRepository.findAll(filter, options);
  }

  async getReminderById(id) {
    try {
      const reminder = await reminderRepository.findById(id);
      if (!reminder) {
        throw Boom.notFound('Reminder not found');
      }
      return reminder;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      throw error;
    }
  }

  async getRemindersByStatus(status) {
    const validStatuses = ['active', 'inactive', 'paused'];
    if (!validStatuses.includes(status)) {
      throw Boom.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return await reminderRepository.findByStatus(status);
  }

  async createReminder(reminderData) {
    try {
      // Validate query conditions
      this.validateQueryConditions(reminderData.queryConditions);

      // Validate message template
      this.validateMessageTemplate(reminderData.message);

      // Calculate next run time
      const nextRun = this.calculateNextRun(reminderData.executeAt, reminderData.frequency);
      reminderData.nextRun = nextRun;

      return await reminderRepository.create(reminderData);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async updateReminder(id, reminderData) {
    try {
      const existing = await reminderRepository.findById(id);
      if (!existing) {
        throw Boom.notFound('Reminder not found');
      }

      // Validate query conditions if provided
      if (reminderData.queryConditions) {
        this.validateQueryConditions(reminderData.queryConditions);
      }

      // Validate message template if provided
      if (reminderData.message) {
        this.validateMessageTemplate(reminderData.message);
      }

      // Recalculate next run if executeAt or frequency changed
      if (reminderData.executeAt || reminderData.frequency) {
        const executeAt = reminderData.executeAt || existing.executeAt;
        const frequency = reminderData.frequency || existing.frequency;
        reminderData.nextRun = this.calculateNextRun(executeAt, frequency);
      }

      const updated = await reminderRepository.update(id, reminderData);
      if (!updated) {
        throw Boom.notFound('Reminder not found');
      }

      return updated;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async updateReminderStatus(id, status) {
    const validStatuses = ['active', 'inactive', 'paused'];
    if (!validStatuses.includes(status)) {
      throw Boom.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const existing = await reminderRepository.findById(id);
      if (!existing) {
        throw Boom.notFound('Reminder not found');
      }

      return await reminderRepository.updateStatus(id, status);
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      throw error;
    }
  }

  async deleteReminder(id) {
    try {
      const reminder = await reminderRepository.findById(id);
      if (!reminder) {
        throw Boom.notFound('Reminder not found');
      }

      const deleted = await reminderRepository.delete(id);
      if (!deleted) {
        throw Boom.internal('Failed to delete reminder');
      }

      return { message: 'Reminder deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      throw error;
    }
  }

  async testQueryConditions(id) {
    try {
      const reminder = await reminderRepository.findById(id);
      if (!reminder) {
        throw Boom.notFound('Reminder not found');
      }

      // Parse query conditions
      const parsedConditions = this.parseQueryConditions(reminder.queryConditions);

      // Count matching customers
      const customers = await customerRepository.findAll(parsedConditions, { limit: 10000 });

      return {
        totalMatching: customers.customers.length,
        queryConditions: reminder.queryConditions,
        parsedConditions: parsedConditions,
        sampleCustomers: customers.customers.slice(0, 5).map(c => ({
          id: c.id,
          name: c.name,
          whatsappNo: c.whatsappNo
        }))
      };
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      throw error;
    }
  }

  async getReminderLogs(id, options = {}) {
    try {
      const reminder = await reminderRepository.findById(id);
      if (!reminder) {
        throw Boom.notFound('Reminder not found');
      }

      return await reminderRepository.findLogsByReminderId(id, options);
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid reminder ID format');
      }
      throw error;
    }
  }

  parseQueryConditions(queryConditions) {
    const parsed = JSON.parse(JSON.stringify(queryConditions));

    const replaceValues = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceValues(obj[key]);
        } else if (typeof obj[key] === 'string') {
          obj[key] = this.parseDatePlaceholder(obj[key]);
        }
      }
    };

    replaceValues(parsed);
    return parsed;
  }

  parseDatePlaceholder(value) {
    if (typeof value !== 'string') return value;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (value === 'TODAY') {
      return today.toISOString();
    }

    if (value === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    }

    if (value === 'TOMORROW') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }

    const dateMinusMatch = value.match(/^DATE_MINUS_(\d+)$/);
    if (dateMinusMatch) {
      const days = parseInt(dateMinusMatch[1]);
      const date = new Date(today);
      date.setDate(date.getDate() - days);
      return date.toISOString();
    }

    const datePlusMatch = value.match(/^DATE_PLUS_(\d+)$/);
    if (datePlusMatch) {
      const days = parseInt(datePlusMatch[1]);
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString();
    }

    return value;
  }

  calculateNextRun(executeAt, frequency) {
    const [hours, minutes] = executeAt.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for next occurrence
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }

  calculateNextRunAfterExecution(currentRun, frequency) {
    const nextRun = new Date(currentRun);

    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    return nextRun;
  }

  validateQueryConditions(queryConditions) {
    if (!queryConditions || typeof queryConditions !== 'object') {
      throw Boom.badRequest('queryConditions must be a valid object');
    }

    // Basic validation - can be extended
    const validateObject = (obj, path = '') => {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          validateObject(value, currentPath);
        }
      }
    };

    try {
      validateObject(queryConditions);
    } catch (error) {
      throw Boom.badRequest(`Invalid query conditions: ${error.message}`);
    }
  }

  validateMessageTemplate(message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw Boom.badRequest('Message template is required');
    }

    // Mustache uses {{variable}} — validate only double-brace placeholders
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    const matches = [...message.matchAll(placeholderPattern)];

    const validPrefixes = ['fullName', 'whatsappNumber', 'address', 'tags', 'daysElapsed', 'data.'];
    for (const match of matches) {
      const placeholder = match[1].trim();
      const isValid = validPrefixes.some(prefix =>
        placeholder === prefix || placeholder.startsWith(prefix)
      );

      if (!isValid) {
        throw Boom.badRequest(
          `Placeholder tidak valid: {{${placeholder}}}. ` +
          `Placeholder yang tersedia: {{fullName}}, {{whatsappNumber}}, {{address}}, {{tags}}, {{daysElapsed}}, {{data.namaField}}`
        );
      }
    }
  }
}

module.exports = new ReminderService();

