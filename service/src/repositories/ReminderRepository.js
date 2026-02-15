const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');

class ReminderRepository {
  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = this.buildQuery(filter);

    const [reminders, total] = await Promise.all([
      Reminder.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Reminder.countDocuments(query)
    ]);

    return {
      reminders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id) {
    return await Reminder.findById(id);
  }

  async findActiveReminders() {
    return await Reminder.find({ status: 'active' });
  }

  async findDueReminders(currentDate = new Date()) {
    return await Reminder.find({
      status: 'active',
      $or: [
        { nextRun: { $lte: currentDate } },
        { nextRun: null }
      ]
    });
  }

  async findByStatus(status) {
    return await Reminder.find({ status }).sort({ nextRun: 1 });
  }

  async create(reminderData) {
    const reminder = new Reminder(reminderData);
    return await reminder.save();
  }

  async update(id, reminderData) {
    return await Reminder.findByIdAndUpdate(
      id,
      reminderData,
      { new: true, runValidators: true }
    );
  }

  async updateStatus(id, status) {
    return await Reminder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async updateRunInfo(id, runInfo) {
    return await Reminder.findByIdAndUpdate(
      id,
      runInfo,
      { new: true }
    );
  }

  async delete(id) {
    const result = await Reminder.findByIdAndDelete(id);
    return result !== null;
  }

  async incrementSuccessCount(id, count = 1) {
    return await Reminder.findByIdAndUpdate(
      id,
      { $inc: { successCount: count } },
      { new: true }
    );
  }

  async incrementFailureCount(id, count = 1) {
    return await Reminder.findByIdAndUpdate(
      id,
      { $inc: { failureCount: count } },
      { new: true }
    );
  }

  // Reminder Log operations
  async createLog(logData) {
    const log = new ReminderLog(logData);
    return await log.save();
  }

  async findLogsByReminderId(reminderId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ReminderLog.find({ reminderId })
        .sort({ executedAt: -1 })
        .skip(skip)
        .limit(limit),
      ReminderLog.countDocuments({ reminderId })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  buildQuery(filter) {
    const query = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.frequency) {
      query.frequency = filter.frequency;
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

module.exports = new ReminderRepository();

