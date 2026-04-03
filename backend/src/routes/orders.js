import Joi from 'joi';
import Boom from '@hapi/boom';
import Order from '../models/Order.js';

const orderItemSchema = Joi.object({
  name: Joi.string().required(),
  qty: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
});

const ordersRoute = {
  name: 'orders',
  version: '1.0.0',
  register(server) {
    // Create order
    server.route({
      method: 'POST',
      path: '/orders',
      options: {
        validate: {
          payload: Joi.object({
            clientPhone: Joi.string().required(),
            clientName: Joi.string().default(''),
            items: Joi.array().items(orderItemSchema).default([]),
            totalAmount: Joi.number().min(0).default(0),
            deliveryDate: Joi.date().iso().required(),
            status: Joi.string()
              .valid('pending', 'confirmed', 'completed', 'cancelled')
              .default('pending'),
            notes: Joi.string().allow('').default(''),
          }),
        },
      },
      async handler(request, h) {
        const order = new Order(request.payload);
        await order.save();
        return h.response(order).code(201);
      },
    });

    // List orders
    server.route({
      method: 'GET',
      path: '/orders',
      options: {
        validate: {
          query: Joi.object({
            status: Joi.string()
              .valid('pending', 'confirmed', 'completed', 'cancelled')
              .optional(),
            clientPhone: Joi.string().optional(),
            from: Joi.date().iso().optional(),
            to: Joi.date().iso().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
          }),
        },
      },
      async handler(request) {
        const { status, clientPhone, from, to, page, limit } = request.query;
        const filter = { deletedAt: null };
        if (status) filter.status = status;
        if (clientPhone) filter.clientPhone = clientPhone;
        if (from || to) {
          filter.deliveryDate = {};
          if (from) filter.deliveryDate.$gte = new Date(from);
          if (to) filter.deliveryDate.$lte = new Date(to);
        }
        const [orders, total] = await Promise.all([
          Order.find(filter)
            .sort({ deliveryDate: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Order.countDocuments(filter),
        ]);
        return { data: orders, total, page, limit };
      },
    });

    // Get single order
    server.route({
      method: 'GET',
      path: '/orders/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().length(24).required() }) },
      },
      async handler(request) {
        const order = await Order.findOne({ _id: request.params.id, deletedAt: null }).lean();
        if (!order) throw Boom.notFound('Order not found');
        return order;
      },
    });

    // Update order
    server.route({
      method: 'PUT',
      path: '/orders/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({
            clientName: Joi.string().optional(),
            items: Joi.array().items(orderItemSchema).optional(),
            totalAmount: Joi.number().min(0).optional(),
            deliveryDate: Joi.date().iso().optional(),
            status: Joi.string()
              .valid('pending', 'confirmed', 'completed', 'cancelled')
              .optional(),
            notes: Joi.string().allow('').optional(),
          }).min(1),
        },
      },
      async handler(request) {
        const order = await Order.findOneAndUpdate(
          { _id: request.params.id, deletedAt: null },
          { $set: request.payload },
          { new: true },
        ).lean();
        if (!order) throw Boom.notFound('Order not found');
        return order;
      },
    });

    // Soft delete order
    server.route({
      method: 'DELETE',
      path: '/orders/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().length(24).required() }) },
      },
      async handler(request, h) {
        const order = await Order.findOneAndUpdate(
          { _id: request.params.id, deletedAt: null },
          { $set: { deletedAt: new Date() } },
          { new: true },
        ).lean();
        if (!order) throw Boom.notFound('Order not found');
        return h.response().code(204);
      },
    });
  },
};

export default ordersRoute;
