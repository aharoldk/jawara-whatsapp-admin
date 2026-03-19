const reminderService = require('../services/ReminderService');
const asyncHandler    = require('../utils/asyncHandler');

const reminderRoutes = [
  {
    method: 'GET', path: '/api/reminders',
    handler: asyncHandler(async (req, h) => {
      const tid = req.app.tenantId;
      const { status, frequency, search, page, limit, sortBy, sortOrder } = req.query;
      const filter  = {};
      if (status)    filter.status    = status;
      if (frequency) filter.frequency = frequency;
      if (search)    filter.search    = search;
      const options = {
        page : parseInt(page)  || 1,
        limit: parseInt(limit) || 10,
        sort : sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 }
      };
      const result = await reminderService.getAllReminders(tid, filter, options);
      return { success: true, data: result.reminders, pagination: result.pagination };
    })
  },
  {
    method: 'GET', path: '/api/reminders/{id}',
    handler: asyncHandler(async (req, h) => {
      const r = await reminderService.getReminderById(req.app.tenantId, req.params.id);
      return { success: true, data: r };
    })
  },
  {
    method: 'POST', path: '/api/reminders',
    handler: asyncHandler(async (req, h) => {
      const r = await reminderService.createReminder(req.app.tenantId, req.payload);
      return h.response({ success: true, data: r, message: 'Reminder berhasil dibuat' }).code(201);
    })
  },
  {
    method: 'PUT', path: '/api/reminders/{id}',
    handler: asyncHandler(async (req, h) => {
      const r = await reminderService.updateReminder(req.app.tenantId, req.params.id, req.payload);
      return { success: true, data: r, message: 'Reminder diperbarui' };
    })
  },
  {
    method: 'PATCH', path: '/api/reminders/{id}/status',
    handler: asyncHandler(async (req, h) => {
      const r = await reminderService.updateReminderStatus(req.app.tenantId, req.params.id, req.payload.status);
      return { success: true, data: r };
    })
  },
  {
    method: 'POST', path: '/api/reminders/{id}/test',
    handler: asyncHandler(async (req, h) => {
      const result = await reminderService.testQueryConditions(req.app.tenantId, req.params.id);
      return { success: true, data: result };
    })
  },
  {
    method: 'POST', path: '/api/reminders/{id}/execute',
    handler: asyncHandler(async (req, h) => {
      const reminderWorker = require('../workers/reminderWorker');
      const r = await reminderService.getReminderById(req.app.tenantId, req.params.id);
      await reminderWorker.processReminder(r, true);
      return { success: true, message: 'Reminder dijalankan manual' };
    })
  },
  {
    method: 'DELETE', path: '/api/reminders/{id}',
    handler: asyncHandler(async (req, h) => {
      const result = await reminderService.deleteReminder(req.app.tenantId, req.params.id);
      return { success: true, message: result.message };
    })
  }
];

module.exports = reminderRoutes;
