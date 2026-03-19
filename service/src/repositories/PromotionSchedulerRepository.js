const PromotionScheduler = require('../models/PromotionScheduler');

class PromotionSchedulerRepository {
  async findAll(tenantId, filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { scheduledAt: 1 } } = options;
    const skip  = (page - 1) * limit;
    const query = this.buildQuery(tenantId, filter);

    const [promotions, total] = await Promise.all([
      PromotionScheduler.find(query).sort(sort).skip(skip).limit(limit),
      PromotionScheduler.countDocuments(query)
    ]);

    return { promotions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId, id) {
    return PromotionScheduler.findOne({ _id: id, tenantId });
  }

  // Dipakai worker — ambil semua tenant
  async findAllPendingSchedules(currentDate = new Date()) {
    return PromotionScheduler.find({
      status     : 'pending',
      scheduledAt: { $lte: currentDate }
    }).populate('tenantId');
  }

  async findByStatus(tenantId, status) {
    return PromotionScheduler.find({ tenantId, status }).sort({ scheduledAt: 1 });
  }

  async create(tenantId, data) {
    return PromotionScheduler.create({ ...data, tenantId });
  }

  async update(tenantId, id, data) {
    return PromotionScheduler.findOneAndUpdate(
      { _id: id, tenantId }, data, { new: true, runValidators: true }
    );
  }

  async updateStatus(tenantId, id, status, additionalData = {}) {
    return PromotionScheduler.findOneAndUpdate(
      { _id: id, tenantId }, { status, ...additionalData }, { new: true }
    );
  }

  async delete(tenantId, id) {
    const result = await PromotionScheduler.findOneAndDelete({ _id: id, tenantId });
    return result !== null;
  }

  async incrementSentCount(id) {
    return PromotionScheduler.findByIdAndUpdate(id, { $inc: { sentCount: 1 } }, { new: true });
  }

  async incrementFailedCount(id) {
    return PromotionScheduler.findByIdAndUpdate(id, { $inc: { failedCount: 1 } }, { new: true });
  }

  buildQuery(tenantId, filter) {
    const query = { tenantId };
    if (filter.status)        query.status        = filter.status;
    if (filter.recurringType) query.recurringType  = filter.recurringType;
    if (filter.fromDate)      query.scheduledAt    = { $gte: new Date(filter.fromDate) };
    if (filter.toDate)        query.scheduledAt    = { ...query.scheduledAt, $lte: new Date(filter.toDate) };
    if (filter.search)        query.$or            = [
      { name   : { $regex: filter.search, $options: 'i' } },
      { message: { $regex: filter.search, $options: 'i' } }
    ];
    return query;
  }
}

module.exports = new PromotionSchedulerRepository();
