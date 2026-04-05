import Joi from 'joi';
import Boom from '@hapi/boom';
import ProductGroup from '../models/ProductGroup.js';
import Product from '../models/Product.js';

const productGroupsRoute = {
  name: 'productGroups',
  version: '1.0.0',
  register(server) {
    // List product groups
    server.route({
      method: 'GET',
      path: '/product-groups',
      options: {
        validate: {
          query: Joi.object({
            active: Joi.boolean().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(500).default(100),
          }),
        },
      },
      async handler(request) {
        const { active, page, limit } = request.query;
        const filter = {};
        if (active !== undefined) filter.active = active;
        const [data, total] = await Promise.all([
          ProductGroup.find(filter)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          ProductGroup.countDocuments(filter),
        ]);
        return { data, total, page, limit };
      },
    });

    // Create product group
    server.route({
      method: 'POST',
      path: '/product-groups',
      options: {
        validate: {
          payload: Joi.object({
            name: Joi.string().trim().required(),
            description: Joi.string().allow('').default(''),
            active: Joi.boolean().default(true),
          }),
        },
      },
      async handler(request, h) {
        try {
          const group = new ProductGroup(request.payload);
          await group.save();
          return h.response(group).code(201);
        } catch (err) {
          if (err.code === 11000) throw Boom.conflict('Product group name already exists');
          throw err;
        }
      },
    });

    // Update product group
    server.route({
      method: 'PUT',
      path: '/product-groups/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({
            name: Joi.string().trim().optional(),
            description: Joi.string().allow('').optional(),
            active: Joi.boolean().optional(),
          }),
        },
      },
      async handler(request) {
        try {
          const group = await ProductGroup.findByIdAndUpdate(
            request.params.id,
            { $set: request.payload },
            { new: true, runValidators: true },
          ).lean();
          if (!group) throw Boom.notFound('Product group not found');
          return group;
        } catch (err) {
          if (err.code === 11000) throw Boom.conflict('Product group name already exists');
          throw err;
        }
      },
    });

    // Delete product group
    server.route({
      method: 'DELETE',
      path: '/product-groups/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
        },
      },
      async handler(request, h) {
        const inUse = await Product.exists({ groupId: request.params.id });
        if (inUse) throw Boom.conflict('Cannot delete: products still belong to this group');
        const group = await ProductGroup.findByIdAndDelete(request.params.id).lean();
        if (!group) throw Boom.notFound('Product group not found');
        return h.response().code(204);
      },
    });
  },
};

export default productGroupsRoute;
