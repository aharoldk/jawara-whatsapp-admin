const PromotionScheduler = require('../models/PromotionScheduler');

class PromotionSchedulerRepository {
  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { scheduledAt: 1 } } = options;
    const skip = (page - 1) * limit;

    const query = this.buildQuery(filter);

    const [promotions, total] = await Promise.all([
      PromotionScheduler.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      PromotionScheduler.countDocuments(query)
    ]);

    return {
      promotions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id) {
    return await PromotionScheduler.findById(id);
  }

  async findPendingSchedules(currentDate = new Date()) {
    return await PromotionScheduler.find({
      status: 'pending',
      scheduledAt: { $lte: currentDate }
    });
  }

  async findByStatus(status) {
    return await PromotionScheduler.find({ status })
      .sort({ scheduledAt: 1 });
  }

  async create(promotionData) {
    const promotion = new PromotionScheduler(promotionData);
    return await promotion.save();
  }

  async update(id, promotionData) {
    return await PromotionScheduler.findByIdAndUpdate(
      id,
      promotionData,
      { new: true, runValidators: true }
    );
  }

  async updateStatus(id, status, additionalData = {}) {
    return await PromotionScheduler.findByIdAndUpdate(
      id,
      { status, ...additionalData },
      { new: true }
    );
  }

  async delete(id) {
    const result = await PromotionScheduler.findByIdAndDelete(id);
    return result !== null;
  }

  async incrementSentCount(id) {
    return await PromotionScheduler.findByIdAndUpdate(
      id,
      { $inc: { sentCount: 1 } },
      { new: true }
    );
  }

  async incrementFailedCount(id) {
    return await PromotionScheduler.findByIdAndUpdate(
      id,
      { $inc: { failedCount: 1 } },
      { new: true }
    );
  }

  buildQuery(filter) {
    const query = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.fromDate) {
      query.scheduledAt = { $gte: new Date(filter.fromDate) };
    }

    if (filter.toDate) {
      query.scheduledAt = {
        ...query.scheduledAt,
        $lte: new Date(filter.toDate)
      };
    }

    if (filter.recurringType) {
      query.recurringType = filter.recurringType;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { message: { $regex: filter.search, $options: 'i' } }
      ];
    }

    return query;
  }
}

module.exports = new PromotionSchedulerRepository();

