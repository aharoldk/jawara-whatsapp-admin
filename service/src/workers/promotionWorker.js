const promotionSchedulerRepository = require('../repositories/PromotionSchedulerRepository');
const wahaService = require('../services/WahaService');
const config = require('../config');

class PromotionWorker {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkIntervalMs = config.scheduler?.interval || 60000;
  }

  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler worker is already running');
      return;
    }

    console.log('⏰ Starting promotion scheduler worker...');
    this.isRunning = true;

    // Run immediately on start
    this.processSchedules();

    // Then run at intervals
    this.interval = setInterval(() => {
      this.processSchedules();
    }, this.checkIntervalMs);

    console.log(`⏰ Scheduler worker started (checking every ${this.checkIntervalMs / 1000}s)`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏰ Scheduler worker stopped');
  }

  async processSchedules() {
    try {
      const currentDate = new Date();
      console.log(`⏰ [${currentDate.toISOString()}] Checking for pending promotions...`);

      const pendingPromotions = await promotionSchedulerRepository.findPendingSchedules(currentDate);

      if (pendingPromotions.length === 0) {
        console.log('⏰ No pending promotions to process');
        return;
      }

      console.log(`⏰ Found ${pendingPromotions.length} promotion(s) to process`);

      for (const promotion of pendingPromotions) {
        await this.processPromotion(promotion);
      }
    } catch (error) {
      console.error('⏰ Error processing schedules:', error);
    }
  }

  async processPromotion(promotion) {
    try {
      console.log(`⏰ Processing promotion: ${promotion.name} (ID: ${promotion.id})`);

      // Update status to processing
      await promotionSchedulerRepository.updateStatus(promotion.id, 'processing');

      const results = {
        sent: 0,
        failed: 0
      };

      // Build customer filter
      const filter = {};
      if (promotion.customerFilter) {
        if (promotion.customerFilter.status) {
          filter.status = promotion.customerFilter.status;
        }
        if (promotion.customerFilter.tags && promotion.customerFilter.tags.length > 0) {
          filter.tag = promotion.customerFilter.tags[0]; // Use first tag for now
        }
      } else {
        // Default to active customers
        filter.status = 'active';
      }

      // Fetch customers dynamically
      const customerRepository = require('../repositories/CustomerRepository');
      const { customers } = await customerRepository.findAll(filter, { limit: 10000 });

      if (customers.length === 0) {
        console.log('⏰ No customers found matching the filter');
        await promotionSchedulerRepository.updateStatus(promotion.id, 'completed', {
          executedAt: new Date(),
          sentCount: 0,
          failedCount: 0
        });
        return;
      }

      console.log(`⏰ Found ${customers.length} customer(s) to send to`);

      // Send messages to all customers
      for (const customer of customers) {
        try {
          const whatsappNo = customer.whatsappNo;
          const name = customer.name;

          if (!whatsappNo) {
            console.error(`⏰ No WhatsApp number for customer: ${name}`);
            results.failed++;
            await promotionSchedulerRepository.incrementFailedCount(promotion.id);
            continue;
          }

          // Personalize message
          let message = promotion.message;
          if (name) {
            message = message.replace(/\{name\}/g, name);
          }

          // Send via WAHA (using default session)
          const wahaService = require('../services/WahaService');
          const whatsappId = whatsappNo.replace(/\D/g, '') + '@c.us';
          await wahaService.sendTextMessage(
            'default',
            whatsappId,
            message
          );

          results.sent++;
          await promotionSchedulerRepository.incrementSentCount(promotion.id);

          console.log(`⏰ Sent to ${name} (${whatsappNo})`);

          // Add small delay to avoid rate limiting
          await this.sleep(1000);
        } catch (error) {
          console.error(`⏰ Failed to send to customer:`, error.message);
          results.failed++;
          await promotionSchedulerRepository.incrementFailedCount(promotion.id);
        }
      }

      // Update final status
      const finalStatus = results.failed > 0 && results.sent === 0 ? 'failed' : 'completed';
      await promotionSchedulerRepository.updateStatus(promotion.id, finalStatus, {
        executedAt: new Date(),
        sentCount: results.sent,
        failedCount: results.failed
      });

      console.log(`⏰ Promotion completed: ${results.sent} sent, ${results.failed} failed`);

      // Handle recurring promotions
      if (promotion.recurringType !== 'none') {
        await this.scheduleNextRecurrence(promotion);
      }
    } catch (error) {
      console.error(`⏰ Error processing promotion ${promotion.id}:`, error);
      await promotionSchedulerRepository.updateStatus(promotion.id, 'failed', {
        error: error.message,
        executedAt: new Date()
      });
    }
  }

  async scheduleNextRecurrence(promotion) {
    try {
      // Check if recurring should continue
      if (promotion.recurringEndDate && new Date() >= new Date(promotion.recurringEndDate)) {
        console.log(`⏰ Recurring promotion ended: ${promotion.name}`);
        return;
      }

      const nextScheduledAt = this.calculateNextSchedule(
        promotion.scheduledAt,
        promotion.recurringType
      );

      // Create new promotion for next occurrence
      const nextPromotion = {
        name: promotion.name,
        message: promotion.message,
        customerFilter: promotion.customerFilter,
        scheduledAt: nextScheduledAt,
        status: 'pending',
        recurringType: promotion.recurringType,
        recurringEndDate: promotion.recurringEndDate,
        timezone: promotion.timezone,
        metadata: promotion.metadata
      };

      await promotionSchedulerRepository.create(nextPromotion);
      console.log(`⏰ Scheduled next recurrence for ${nextScheduledAt.toISOString()}`);
    } catch (error) {
      console.error('⏰ Error scheduling next recurrence:', error);
    }
  }

  calculateNextSchedule(currentSchedule, recurringType) {
    const nextDate = new Date(currentSchedule);

    switch (recurringType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PromotionWorker();


