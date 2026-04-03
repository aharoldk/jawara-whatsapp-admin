import Joi from 'joi';
import Order from '../models/Order.js';

const reportsRoute = {
  name: 'reports',
  version: '1.0.0',
  register(server) {
    server.route({
      method: 'GET',
      path: '/reports',
      options: {
        validate: {
          query: Joi.object({
            type: Joi.string().valid('daily', 'weekly', 'monthly').default('monthly'),
            from: Joi.date().iso().optional(),
            to: Joi.date().iso().optional(),
          }),
        },
      },
      async handler(request) {
        const { type, from, to } = request.query;

        // Build date range if not explicitly provided
        const now = new Date();
        let start, end;
        if (from && to) {
          start = new Date(from);
          end = new Date(to);
        } else if (type === 'daily') {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (type === 'weekly') {
          const day = now.getDay(); // 0=Sun
          start = new Date(now);
          start.setDate(now.getDate() - day);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
        } else {
          // monthly
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const orders = await Order.find({
          deliveryDate: { $gte: start, $lte: end },
          deletedAt: null,
        }).lean();

        const statusBreakdown = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        const itemMap = {};
        let totalRevenue = 0;

        for (const order of orders) {
          statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;
          if (order.status !== 'cancelled') {
            totalRevenue += order.totalAmount;
          }
          for (const item of order.items) {
            if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
            itemMap[item.name].qty += item.qty;
            itemMap[item.name].revenue += item.qty * item.price;
          }
        }

        const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

        return {
          type,
          from: start.toISOString(),
          to: end.toISOString(),
          totalOrders: orders.length,
          totalRevenue,
          statusBreakdown,
          topItems,
        };
      },
    });
  },
};

export default reportsRoute;
