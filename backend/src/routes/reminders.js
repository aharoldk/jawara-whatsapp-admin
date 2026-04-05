import Joi from 'joi';
import Boom from '@hapi/boom';
import Reminder from '../models/Reminder.js';

const remindersRoute = {
  name: 'reminders',
  version: '1.0.0',
  register(server) {
    // Create reminder
    server.route({
      method: 'POST',
      path: '/reminders',
      options: {
        validate: {
          payload: Joi.object({
            orderId: Joi.string().length(24).optional().allow(null),
            recipientPhone: Joi.string().required(),
            message: Joi.string().required(),
            scheduledAt: Joi.date().iso().required(),
          }),
        },
      },
      async handler(request, h) {
        const reminder = new Reminder(request.payload);
        await reminder.save();
        return h.response(reminder).code(201);
      },
    });

    // List pending reminders (used by n8n scheduler)
    server.route({
      method: 'GET',
      path: '/reminders/pending',
      handler: async () => {
        const reminders = await Reminder.find({
          sent: false,
          scheduledAt: { $lte: new Date() },
        })
          .sort({ scheduledAt: 1 })
          .lean();
        return { data: reminders, total: reminders.length };
      },
    });

    // List all reminders
    server.route({
      method: 'GET',
      path: '/reminders',
      options: {
        validate: {
          query: Joi.object({
            sent: Joi.boolean().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(500).default(20),
          }),
        },
      },
      async handler(request) {
        const { sent, page, limit } = request.query;
        const filter = {};
        if (sent !== undefined) filter.sent = sent;
        const [reminders, total] = await Promise.all([
          Reminder.find(filter)
            .sort({ scheduledAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Reminder.countDocuments(filter),
        ]);
        return { data: reminders, total, page, limit };
      },
    });

    // Mark reminder as sent
    server.route({
      method: 'PUT',
      path: '/reminders/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({ sent: Joi.boolean().required() }),
        },
      },
      async handler(request) {
        const update = { sent: request.payload.sent };
        if (request.payload.sent) update.sentAt = new Date();
        const reminder = await Reminder.findByIdAndUpdate(
          request.params.id,
          { $set: update },
          { new: true },
        ).lean();
        if (!reminder) throw Boom.notFound('Reminder not found');
        return reminder;
      },
    });

    // Delete reminder
    server.route({
      method: 'DELETE',
      path: '/reminders/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().length(24).required() }) },
      },
      async handler(request, h) {
        const reminder = await Reminder.findByIdAndDelete(request.params.id).lean();
        if (!reminder) throw Boom.notFound('Reminder not found');
        return h.response().code(204);
      },
    });
  },
};

export default remindersRoute;
