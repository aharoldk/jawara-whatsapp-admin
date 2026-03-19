const Reminder = require('../models/Reminder');

class ReminderRepository {
  async findAll(tenantId, filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip  = (page - 1) * limit;
    const query = this.buildQuery(tenantId, filter);

    const [reminders, total] = await Promise.all([
      Reminder.find(query).sort(sort).skip(skip).limit(limit),
      Reminder.countDocuments(query)
    ]);

    return { reminders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId, id) {
    return Reminder.findOne({ _id: id, tenantId });
  }

  async findActiveReminders(tenantId) {
    return Reminder.find({ tenantId, status: 'active' });
  }

  // Dipakai worker — ambil semua tenant
  async findAllDueReminders(currentDate = new Date()) {
    return Reminder.find({
      status: 'active',
      $or: [{ nextRun: { $lte: currentDate } }, { nextRun: null }]
    }).populate('tenantId');
  }

  async findByStatus(tenantId, status) {
    return Reminder.find({ tenantId, status }).sort({ nextRun: 1 });
  }

  async create(tenantId, data) {
    return Reminder.create({ ...data, tenantId });
  }

  async update(tenantId, id, data) {
    return Reminder.findOneAndUpdate(
      { _id: id, tenantId }, data, { new: true, runValidators: true }
    );
  }

  async updateStatus(tenantId, id, status) {
    return Reminder.findOneAndUpdate({ _id: id, tenantId }, { status }, { new: true });
  }

  async updateRunInfo(id, runInfo) {
    return Reminder.findByIdAndUpdate(id, runInfo, { new: true });
  }

  async delete(tenantId, id) {
    const result = await Reminder.findOneAndDelete({ _id: id, tenantId });
    return result !== null;
  }

  async incrementSuccessCount(id, count = 1) {
    return Reminder.findByIdAndUpdate(id, { $inc: { successCount: count } }, { new: true });
  }

  async incrementFailureCount(id, count = 1) {
    return Reminder.findByIdAndUpdate(id, { $inc: { failureCount: count } }, { new: true });
  }

  buildQuery(tenantId, filter) {
    const query = { tenantId };
    if (filter.status)    query.status    = filter.status;
    if (filter.frequency) query.frequency = filter.frequency;
    if (filter.search)    query.$or = [
      { name   : { $regex: filter.search, $options: 'i' } },
      { message: { $regex: filter.search, $options: 'i' } }
    ];
    return query;
  }
}

module.exports = new ReminderRepository();
