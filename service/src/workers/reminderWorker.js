const cron = require('node-cron');
const Mustache = require('mustache');
const reminderRepository = require('../repositories/ReminderRepository');
const customerRepository = require('../repositories/CustomerRepository');
const reminderService = require('../services/ReminderService');
const wahaService = require('../services/WahaService');
const Customer = require('../models/Customer');

class ReminderWorker {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.cronExpression = process.env.REMINDER_CRON || '* * * * *';
    this.rateLimit = parseInt(process.env.MESSAGE_RATE_LIMIT) || 1000;
  }

  start() {
    if (this.isRunning) {
      console.log('⏰ Reminder worker already running');
      return;
    }
    console.log(`⏰ Starting reminder worker [cron: ${this.cronExpression}]`);
    this.isRunning = true;

    this.checkReminders();

    this.task = cron.schedule(this.cronExpression, () => {
      this.checkReminders();
    }, { timezone: process.env.TZ || 'Asia/Jakarta' });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('⏰ Reminder worker stopped');
  }

  async checkReminders() {
    try {
      const now = new Date();
      console.log(`⏰ [Reminder] Checking due reminders at ${now.toISOString()}`);

      const dueReminders = await reminderRepository.findAllDueReminders(now);
      if (dueReminders.length === 0) {
        console.log('⏰ No due reminders');
        return;
      }

      console.log(`⏰ Found ${dueReminders.length} due reminder(s)`);
      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }
    } catch (error) {
      console.error('⏰ Error checking reminders:', error);
    }
  }

  async processReminder(reminder, isManual = false) {
    try {
      console.log(`⏰ Processing reminder: "${reminder.name}" (${reminder.id})`);

      // Parse date placeholders in queryConditions
      const parsedConditions = reminderService.parseQueryConditions(reminder.queryConditions);
      const mongoQuery = this.buildMongoQuery(parsedConditions);
      // Scope customers to this tenant
      const tenantId = reminder.tenantId?._id || reminder.tenantId;
      mongoQuery.tenantId = tenantId;
      const customers = await Customer.find(mongoQuery).lean();

      console.log(`⏰ Matched ${customers.length} customer(s)`);

      let successCount = 0, failureCount = 0;

      for (const customer of customers) {
        try {
          if (!customer.whatsappNumber) {
            console.warn(`⏰ No WhatsApp number: ${customer.fullName}`);
            failureCount++;
            continue;
          }

          // Build template data for Mustache
          const daysElapsed = this.calculateDaysElapsed(customer, parsedConditions);
          const templateData = {
            fullName: customer.fullName || '',
            whatsappNumber: customer.whatsappNumber || '',
            address: customer.address || '',
            daysElapsed: daysElapsed,
            tags: (customer.tags || []).join(', '),
            data: {
              ibukandung: customer.data?.ibukandung || '',
              npwp: customer.data?.npwp || '',
              lastServiceDate: customer.data?.lastServiceDate
                ? new Date(customer.data.lastServiceDate).toLocaleDateString('id-ID')
                : '',
              lastOrder: customer.data?.lastOrder || '',
              vehicle: (customer.data?.vehicle || []).join(', '),
              ...(customer.data?.extra || {})
            }
          };

          const message = Mustache.render(reminder.message, templateData);
          const chatId = customer.whatsappNumber.replace(/\D/g, '') + '@c.us';

          await wahaService.sendTextMessage('default', chatId, message);
          successCount++;
          console.log(`⏰ Sent to ${customer.fullName}`);

          await this.sleep(this.rateLimit);
        } catch (err) {
          failureCount++;
          console.error(`⏰ Failed to send to ${customer.fullName}:`, err.message);
        }
      }

      if (successCount > 0) await reminderRepository.incrementSuccessCount(reminder._id, successCount);
      if (failureCount > 0) await reminderRepository.incrementFailureCount(reminder._id, failureCount);

      const updateData = { lastRun: new Date() };
      if (!isManual) {
        updateData.nextRun = reminderService.calculateNextRunAfterExecution(new Date(), reminder.frequency);
      }
      await reminderRepository.updateRunInfo(reminder._id, updateData);

      console.log(`⏰ Reminder "${reminder.name}" done: ${successCount} sent, ${failureCount} failed`);
      if (!isManual && updateData.nextRun) {
        console.log(`⏰ Next run: ${updateData.nextRun.toISOString()}`);
      }
    } catch (error) {
      console.error(`⏰ Error processing reminder ${reminder.id}:`, error);
    }
  }

  buildMongoQuery(conditions) {
    const query = {};
    for (const key in conditions) {
      query[key] = this.processConditionValue(conditions[key]);
    }
    return query;
  }

  processConditionValue(value) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const processed = {};
      for (const op in value) {
        processed[op] = this.processConditionValue(value[op]);
      }
      return processed;
    }
    return value;
  }

  calculateDaysElapsed(customer, queryConditions) {
    const dateFields = ['data.lastServiceDate', 'data.lastOrderDate', 'data.lastVisit'];
    for (const field of dateFields) {
      if (queryConditions[field] && customer.data) {
        const subField = field.replace('data.', '');
        const dateValue = customer.data[subField];
        if (dateValue) {
          const diffTime = Math.abs(new Date() - new Date(dateValue));
          return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    }
    return 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ReminderWorker();
