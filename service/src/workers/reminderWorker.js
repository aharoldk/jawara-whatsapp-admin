const reminderRepository = require('../repositories/ReminderRepository');
const customerRepository = require('../repositories/CustomerRepository');
const reminderService = require('../services/ReminderService');
const wahaService = require('../services/WahaService');
const config = require('../config');
const Customer = require('../models/Customer');

class ReminderWorker {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkIntervalMs = config.reminder?.interval || 60000;
    this.rateLimit = config.reminder?.rateLimit || 1000;
  }

  start() {
    if (this.isRunning) {
      console.log('⏰ Reminder worker is already running');
      return;
    }

    console.log('⏰ Starting reminder worker...');
    this.isRunning = true;

    // Run immediately on start
    this.checkReminders();

    // Then run at intervals
    this.interval = setInterval(() => {
      this.checkReminders();
    }, this.checkIntervalMs);

    console.log(`⏰ Reminder worker started (checking every ${this.checkIntervalMs / 1000}s)`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏰ Reminder worker stopped');
  }

  async checkReminders() {
    try {
      const currentDate = new Date();
      console.log(`⏰ [${currentDate.toISOString()}] Checking for due reminders...`);

      const dueReminders = await reminderRepository.findDueReminders(currentDate);

      if (dueReminders.length === 0) {
        console.log('⏰ No due reminders to process');
        return;
      }

      console.log(`⏰ Found ${dueReminders.length} due reminder(s) to process`);

      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }
    } catch (error) {
      console.error('⏰ Error checking reminders:', error);
    }
  }

  async processReminder(reminder, isManual = false) {
    const logData = {
      reminderId: reminder._id,
      executedAt: new Date(),
      status: 'success',
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      queryConditionsUsed: reminder.queryConditions,
      details: {}
    };

    try {
      console.log(`⏰ Processing reminder: ${reminder.name} (ID: ${reminder.id})`);

      // Parse query conditions
      const parsedConditions = reminderService.parseQueryConditions(reminder.queryConditions);
      console.log('⏰ Parsed conditions:', JSON.stringify(parsedConditions));

      // Query customers using MongoDB directly for complex queries
      const customers = await this.queryCustomers(parsedConditions);
      logData.totalRecipients = customers.length;

      if (customers.length === 0) {
        console.log('⏰ No customers match the query conditions');
        logData.status = 'success';
        logData.details.message = 'No matching customers found';
      } else {
        console.log(`⏰ Found ${customers.length} matching customer(s)`);

        // Send messages to all matching customers
        for (const customer of customers) {
          try {
            // Personalize message
            const personalizedMessage = this.personalizeMessage(
              reminder.message,
              customer,
              reminder.queryConditions
            );

            // Send via WAHA
            const whatsappId = customer.whatsappNo.replace(/\D/g, '') + '@c.us';
            await wahaService.sendTextMessage(
              'default',
              whatsappId,
              personalizedMessage
            );

            logData.successCount++;
            console.log(`⏰ Sent to ${customer.name} (${customer.whatsappNo})`);

            // Rate limiting
            await this.sleep(this.rateLimit);
          } catch (error) {
            logData.failureCount++;
            console.error(`⏰ Failed to send to ${customer.name}:`, error.message);
          }
        }

        // Update reminder counts
        await reminderRepository.incrementSuccessCount(reminder._id, logData.successCount);
        await reminderRepository.incrementFailureCount(reminder._id, logData.failureCount);
      }

      // Determine log status
      if (logData.failureCount > 0 && logData.successCount === 0) {
        logData.status = 'failed';
      } else if (logData.failureCount > 0) {
        logData.status = 'partial';
      }

      // Update last run and calculate next run
      const updateData = {
        lastRun: new Date()
      };

      if (!isManual) {
        updateData.nextRun = reminderService.calculateNextRunAfterExecution(
          new Date(),
          reminder.frequency
        );
      }

      await reminderRepository.updateRunInfo(reminder._id, updateData);

      console.log(`⏰ Reminder completed: ${logData.successCount} sent, ${logData.failureCount} failed`);
      if (!isManual) {
        console.log(`⏰ Next run scheduled for: ${updateData.nextRun.toISOString()}`);
      }

    } catch (error) {
      console.error(`⏰ Error processing reminder ${reminder.id}:`, error);
      logData.status = 'failed';
      logData.error = error.message;
      logData.details.stack = error.stack;
    }

    // Save execution log
    await reminderRepository.createLog(logData);
  }

  async queryCustomers(parsedConditions) {
    try {
      // Build MongoDB query from parsed conditions
      const query = this.buildMongoQuery(parsedConditions);

      // Execute query
      const customers = await Customer.find(query).lean();

      return customers;
    } catch (error) {
      console.error('⏰ Error querying customers:', error);
      throw error;
    }
  }

  buildMongoQuery(conditions) {
    const query = {};

    for (const key in conditions) {
      const value = conditions[key];

      // Handle nested payload fields
      if (key.startsWith('payload.')) {
        query[key] = this.processConditionValue(value);
      } else if (key === 'status' || key === 'tags') {
        query[key] = this.processConditionValue(value);
      } else {
        query[key] = this.processConditionValue(value);
      }
    }

    return query;
  }

  processConditionValue(value) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle operators like $lt, $gt, etc.
      const processed = {};
      for (const op in value) {
        if (op.startsWith('$')) {
          processed[op] = value[op];
        } else {
          processed[op] = this.processConditionValue(value[op]);
        }
      }
      return processed;
    }
    return value;
  }

  personalizeMessage(message, customer, queryConditions) {
    let personalized = message;

    // Replace {name}
    personalized = personalized.replace(/\{name\}/g, customer.name || '');

    // Replace {whatsappNo}
    personalized = personalized.replace(/\{whatsappNo\}/g, customer.whatsappNo || '');

    // Replace {payload.fieldName}
    const payloadMatches = personalized.match(/\{payload\.([^}]+)\}/g);
    if (payloadMatches && customer.payload) {
      for (const match of payloadMatches) {
        const fieldName = match.match(/\{payload\.([^}]+)\}/)[1];
        const value = this.getNestedValue(customer.payload, fieldName);
        personalized = personalized.replace(match, value || '');
      }
    }

    // Replace {daysElapsed}
    if (personalized.includes('{daysElapsed}')) {
      const daysElapsed = this.calculateDaysElapsed(customer, queryConditions);
      personalized = personalized.replace(/\{daysElapsed\}/g, daysElapsed);
    }

    return personalized;
  }

  calculateDaysElapsed(customer, queryConditions) {
    // Try to find date field from query conditions
    const dateFields = ['payload.lastServiceDate', 'payload.lastSessionDate', 'payload.lastVisit'];

    for (const field of dateFields) {
      if (queryConditions[field] && customer.payload) {
        const fieldName = field.replace('payload.', '');
        const dateValue = this.getNestedValue(customer.payload, fieldName);

        if (dateValue) {
          const date = new Date(dateValue);
          const now = new Date();
          const diffTime = Math.abs(now - date);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        }
      }
    }

    return 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) =>
      current && current[prop] !== undefined ? current[prop] : null, obj
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ReminderWorker();

