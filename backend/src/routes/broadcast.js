import Joi from 'joi';
import Boom from '@hapi/boom';
import BroadcastList from '../models/BroadcastList.js';
import BroadcastJob from '../models/BroadcastJob.js';

const broadcastRoute = {
  name: 'broadcast',
  version: '1.0.0',
  register(server) {
    // ─── Broadcast Lists ──────────────────────────────────────────────

    server.route({
      method: 'POST',
      path: '/broadcast/lists',
      options: {
        validate: {
          payload: Joi.object({
            name: Joi.string().required(),
            recipientPhones: Joi.array().items(Joi.string()).default([]),
          }),
        },
      },
      async handler(request, h) {
        const list = new BroadcastList(request.payload);
        await list.save();
        return h.response(list).code(201);
      },
    });

    server.route({
      method: 'GET',
      path: '/broadcast/lists',
      handler: async () => {
        const lists = await BroadcastList.find().sort({ createdAt: -1 }).lean();
        return { data: lists, total: lists.length };
      },
    });

    server.route({
      method: 'GET',
      path: '/broadcast/lists/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().length(24).required() }) },
      },
      async handler(request) {
        const list = await BroadcastList.findById(request.params.id).lean();
        if (!list) throw Boom.notFound('Broadcast list not found');
        return list;
      },
    });

    server.route({
      method: 'PUT',
      path: '/broadcast/lists/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({
            name: Joi.string().optional(),
            recipientPhones: Joi.array().items(Joi.string()).optional(),
          }).min(1),
        },
      },
      async handler(request) {
        const list = await BroadcastList.findByIdAndUpdate(
          request.params.id,
          { $set: request.payload },
          { new: true },
        ).lean();
        if (!list) throw Boom.notFound('Broadcast list not found');
        return list;
      },
    });

    server.route({
      method: 'DELETE',
      path: '/broadcast/lists/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().length(24).required() }) },
      },
      async handler(request, h) {
        const list = await BroadcastList.findByIdAndDelete(request.params.id).lean();
        if (!list) throw Boom.notFound('Broadcast list not found');
        return h.response().code(204);
      },
    });

    // ─── Broadcast Jobs ───────────────────────────────────────────────

    server.route({
      method: 'POST',
      path: '/broadcast/jobs',
      options: {
        validate: {
          payload: Joi.object({
            listId: Joi.string().length(24).required(),
            message: Joi.string().required(),
            scheduledAt: Joi.date().iso().required(),
          }),
        },
      },
      async handler(request, h) {
        const list = await BroadcastList.findById(request.payload.listId).lean();
        if (!list) throw Boom.notFound('Broadcast list not found');
        const job = new BroadcastJob({
          ...request.payload,
          totalRecipients: list.recipientPhones.length,
        });
        await job.save();
        return h.response(job).code(201);
      },
    });

    // Pending jobs endpoint (polled by n8n scheduler)
    server.route({
      method: 'GET',
      path: '/broadcast/jobs/pending',
      handler: async () => {
        const jobs = await BroadcastJob.find({
          status: 'pending',
          scheduledAt: { $lte: new Date() },
        })
          .populate('listId')
          .sort({ scheduledAt: 1 })
          .lean();
        return { data: jobs, total: jobs.length };
      },
    });

    // Broadcast history
    server.route({
      method: 'GET',
      path: '/broadcast/history',
      options: {
        validate: {
          query: Joi.object({
            status: Joi.string()
              .valid('pending', 'sending', 'completed', 'failed')
              .optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
          }),
        },
      },
      async handler(request) {
        const { status, page, limit } = request.query;
        const filter = {};
        if (status) filter.status = status;
        const [jobs, total] = await Promise.all([
          BroadcastJob.find(filter)
            .sort({ scheduledAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('listId', 'name')
            .lean(),
          BroadcastJob.countDocuments(filter),
        ]);
        return { data: jobs, total, page, limit };
      },
    });

    // Update broadcast job status (used by n8n after sending)
    server.route({
      method: 'PUT',
      path: '/broadcast/jobs/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({
            status: Joi.string()
              .valid('pending', 'sending', 'completed', 'failed')
              .required(),
            sentCount: Joi.number().integer().min(0).optional(),
            failedCount: Joi.number().integer().min(0).optional(),
          }),
        },
      },
      async handler(request) {
        const update = { ...request.payload };
        if (request.payload.status === 'completed') update.completedAt = new Date();
        const job = await BroadcastJob.findByIdAndUpdate(
          request.params.id,
          { $set: update },
          { new: true },
        ).lean();
        if (!job) throw Boom.notFound('Broadcast job not found');
        return job;
      },
    });
  },
};

export default broadcastRoute;
