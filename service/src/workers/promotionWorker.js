const cron = require('node-cron');
const Mustache = require('mustache');
const promotionSchedulerRepository = require('../repositories/PromotionSchedulerRepository');
const wahaService = require('../services/WahaService');
const config = require('../config');

class PromotionWorker {
  constructor() {
    this.task = null;
    this.isRunning = false;
    // Cron: every minute by default. Can be overridden via SCHEDULER_CRON env
    this.cronExpression = process.env.SCHEDULER_CRON || '* * * * *';
  }

  start() {
    if (this.isRunning) {
      console.log('⏰ Promotion worker already running');
      return;
    }
    console.log(`⏰ Starting promotion worker [cron: ${this.cronExpression}]`);
    this.isRunning = true;

    // Run immediately on start
    this.processSchedules();

    // Schedule with node-cron
    this.task = cron.schedule(this.cronExpression, () => {
      this.processSchedules();
    }, { timezone: process.env.TZ || 'Asia/Jakarta' });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('⏰ Promotion worker stopped');
  }

  async processSchedules() {
    try {
      const now = new Date();
      console.log(`⏰ [Promotion] Checking pending promotions at ${now.toISOString()}`);

      const pending = await promotionSchedulerRepository.findAllPendingSchedules(now);
      if (pending.length === 0) {
        console.log('⏰ No pending promotions');
        return;
      }

      console.log(`⏰ Found ${pending.length} promotion(s) to process`);
      for (const promotion of pending) {
        await this.processPromotion(promotion);
      }
    } catch (error) {
      console.error('⏰ Error in promotion worker:', error);
    }
  }

  async processPromotion(promotion) {
    try {
      console.log(`⏰ Processing promotion: "${promotion.name}" (${promotion.id})`);
      const tenantId = promotion.tenantId?._id || promotion.tenantId;
      await promotionSchedulerRepository.updateStatus(tenantId, promotion.id, 'processing');

      // Build customer filter — scoped to this tenant
      const filter = {};
      if (promotion.customerFilter?.status) filter.status = promotion.customerFilter.status;
      else filter.status = 'active';
      if (promotion.customerFilter?.tags?.length > 0) filter.tag = promotion.customerFilter.tags[0];

      const customerRepository = require('../repositories/CustomerRepository');
      const { customers } = await customerRepository.findAll(tenantId, filter, { limit: 10000 });

      if (customers.length === 0) {
        console.log('⏰ No customers matched filter');
        await promotionSchedulerRepository.updateStatus(tenantId, promotion.id, 'completed', {
          executedAt: new Date(), sentCount: 0, failedCount: 0
        });
        return;
      }

      console.log(`⏰ Sending to ${customers.length} customer(s)`);
      let sent = 0, failed = 0;

      for (const customer of customers) {
        try {
          if (!customer.whatsappNumber) {
            console.warn(`⏰ No WhatsApp number for: ${customer.fullName}`);
            failed++;
            continue;
          }

          // Hydrate template using Mustache
          // Template variables: {{fullName}}, {{data.lastServiceDate}}, {{data.vehicle}}, etc.
          const templateData = {
            fullName: customer.fullName || '',
            whatsappNumber: customer.whatsappNumber || '',
            address: customer.address || '',
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

          const message = Mustache.render(promotion.message, templateData);
          const chatId = customer.whatsappNumber.replace(/\D/g, '') + '@c.us';

          await wahaService.sendTextMessage('default', chatId, message);
          sent++;
          await promotionSchedulerRepository.incrementSentCount(promotion.id);
          console.log(`⏰ Sent to ${customer.fullName} (${customer.whatsappNumber})`);

          // Rate limiting: 1s between messages to avoid WA ban
          await this.sleep(1000);
        } catch (err) {
          failed++;
          await promotionSchedulerRepository.incrementFailedCount(promotion.id);
          console.error(`⏰ Failed to send to ${customer.fullName}:`, err.message);
        }
      }

      const finalStatus = failed > 0 && sent === 0 ? 'failed' : 'completed';
      await promotionSchedulerRepository.updateStatus(promotion.id, finalStatus, {
        executedAt: new Date(),
        sentCount: sent,
        failedCount: failed
      });
      console.log(`⏰ Promotion "${promotion.name}" done: ${sent} sent, ${failed} failed`);

      // Handle recurring
      if (promotion.recurringType !== 'none') {
        await this.scheduleNextRecurrence(promotion);
      }
    } catch (error) {
      console.error(`⏰ Error processing promotion ${promotion.id}:`, error);
      await promotionSchedulerRepository.updateStatus(tenantId, promotion.id, 'failed', {
        error: error.message, executedAt: new Date()
      });
    }
  }

  async scheduleNextRecurrence(promotion) {
    try {
      if (promotion.recurringEndDate && new Date() >= new Date(promotion.recurringEndDate)) {
        console.log(`⏰ Recurring ended for: ${promotion.name}`);
        return;
      }
      const nextScheduledAt = this.calculateNextSchedule(promotion.scheduledAt, promotion.recurringType);
      await promotionSchedulerRepository.create({
        name: promotion.name,
        message: promotion.message,
        customerFilter: promotion.customerFilter,
        scheduledAt: nextScheduledAt,
        status: 'pending',
        recurringType: promotion.recurringType,
        recurringEndDate: promotion.recurringEndDate,
        timezone: promotion.timezone,
        metadata: promotion.metadata
      });
      console.log(`⏰ Next recurrence scheduled: ${nextScheduledAt.toISOString()}`);
    } catch (error) {
      console.error('⏰ Error scheduling next recurrence:', error);
    }
  }

  calculateNextSchedule(current, type) {
    const next = new Date(current);
    if (type === 'daily') next.setDate(next.getDate() + 1);
    else if (type === 'weekly') next.setDate(next.getDate() + 7);
    else if (type === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (type === 'yearly') next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PromotionWorker();
