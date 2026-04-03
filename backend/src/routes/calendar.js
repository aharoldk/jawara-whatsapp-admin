import Joi from 'joi';
import Order from '../models/Order.js';

const calendarRoute = {
  name: 'calendar',
  version: '1.0.0',
  register(server) {
    // Monthly view — returns orders grouped by day
    server.route({
      method: 'GET',
      path: '/calendar',
      options: {
        validate: {
          query: Joi.object({
            // Expected format: YYYY-MM  e.g. 2026-03
            month: Joi.string()
              .pattern(/^\d{4}-\d{2}$/)
              .required(),
          }),
        },
      },
      async handler(request) {
        const [year, month] = request.query.month.split('-').map(Number);
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

        const orders = await Order.find({
          deliveryDate: { $gte: from, $lte: to },
          deletedAt: null,
        })
          .sort({ deliveryDate: 1 })
          .lean();

        // Group by YYYY-MM-DD
        const grouped = {};
        for (const order of orders) {
          const key = order.deliveryDate.toISOString().slice(0, 10);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(order);
        }

        return { month: request.query.month, days: grouped };
      },
    });

    // Daily view
    server.route({
      method: 'GET',
      path: '/calendar/day',
      options: {
        validate: {
          query: Joi.object({
            date: Joi.date().iso().required(),
          }),
        },
      },
      async handler(request) {
        const day = new Date(request.query.date);
        const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const to = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

        const orders = await Order.find({
          deliveryDate: { $gte: from, $lte: to },
          deletedAt: null,
        })
          .sort({ deliveryDate: 1 })
          .lean();

        return {
          date: from.toISOString().slice(0, 10),
          total: orders.length,
          orders,
        };
      },
    });
  },
};

export default calendarRoute;
