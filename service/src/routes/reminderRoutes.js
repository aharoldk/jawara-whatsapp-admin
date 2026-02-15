const reminderService = require('../services/ReminderService');
const asyncHandler = require('../utils/asyncHandler');

const reminderRoutes = [
  {
    method: 'GET',
    path: '/api/reminders',
    handler: asyncHandler(async (request, h) => {
      const { status, frequency, search, page, limit, sortBy, sortOrder } = request.query;

      const filter = {};
      if (status) filter.status = status;
      if (frequency) filter.frequency = frequency;
      if (search) filter.search = search;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: {}
      };

      if (sortBy) {
        options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        options.sort = { createdAt: -1 };
      }

      const result = await reminderService.getAllReminders(filter, options);
      return {
        success: true,
        data: result.reminders,
        pagination: result.pagination
      };
    })
  },
  {
    method: 'GET',
    path: '/api/reminders/{id}',
    handler: asyncHandler(async (request, h) => {
      const reminder = await reminderService.getReminderById(request.params.id);
      return {
        success: true,
        data: reminder
      };
    })
  },
  {
    method: 'GET',
    path: '/api/reminders/status/{status}',
    handler: asyncHandler(async (request, h) => {
      const reminders = await reminderService.getRemindersByStatus(request.params.status);
      return {
        success: true,
        data: reminders
      };
    })
  },
  {
    method: 'POST',
    path: '/api/reminders',
    handler: asyncHandler(async (request, h) => {
      const reminder = await reminderService.createReminder(request.payload);
      return h.response({
        success: true,
        data: reminder,
        message: 'Reminder created successfully'
      }).code(201);
    })
  },
  {
    method: 'PUT',
    path: '/api/reminders/{id}',
    handler: asyncHandler(async (request, h) => {
      const reminder = await reminderService.updateReminder(request.params.id, request.payload);
      return {
        success: true,
        data: reminder,
        message: 'Reminder updated successfully'
      };
    })
  },
  {
    method: 'PATCH',
    path: '/api/reminders/{id}/status',
    handler: asyncHandler(async (request, h) => {
      const { status } = request.payload;
      const reminder = await reminderService.updateReminderStatus(request.params.id, status);
      return {
        success: true,
        data: reminder,
        message: 'Reminder status updated successfully'
      };
    })
  },
  {
    method: 'POST',
    path: '/api/reminders/{id}/test',
    handler: asyncHandler(async (request, h) => {
      const result = await reminderService.testQueryConditions(request.params.id);
      return {
        success: true,
        data: result,
        message: `Found ${result.totalMatching} matching customer(s)`
      };
    })
  },
  {
    method: 'POST',
    path: '/api/reminders/{id}/execute',
    handler: asyncHandler(async (request, h) => {
      const reminderWorker = require('../workers/reminderWorker');
      const reminder = await reminderService.getReminderById(request.params.id);

      // Execute reminder manually
      await reminderWorker.processReminder(reminder, true);

      return {
        success: true,
        message: 'Reminder execution triggered successfully'
      };
    })
  },
  {
    method: 'GET',
    path: '/api/reminders/{id}/logs',
    handler: asyncHandler(async (request, h) => {
      const { page, limit } = request.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await reminderService.getReminderLogs(request.params.id, options);
      return {
        success: true,
        data: result.logs,
        pagination: result.pagination
      };
    })
  },
  {
    method: 'DELETE',
    path: '/api/reminders/{id}',
    handler: asyncHandler(async (request, h) => {
      const result = await reminderService.deleteReminder(request.params.id);
      return {
        success: true,
        message: result.message
      };
    })
  }
];

module.exports = reminderRoutes;

