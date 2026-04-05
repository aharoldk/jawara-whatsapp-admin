import Joi from 'joi';
import Boom from '@hapi/boom';
import Product from '../models/Product.js';

const productsRoute = {
  name: 'products',
  version: '1.0.0',
  register(server) {
    // List products
    server.route({
      method: 'GET',
      path: '/products',
      options: {
        validate: {
          query: Joi.object({
            groupId: Joi.string().length(24).optional(),
            active: Joi.boolean().optional(),
            search: Joi.string().trim().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(500).default(20),
          }),
        },
      },
      async handler(request) {
        const { groupId, active, search, page, limit } = request.query;
        const filter = {};
        if (groupId) filter.groupId = groupId;
        if (active !== undefined) filter.active = active;
        if (search) filter.name = { $regex: search, $options: 'i' };
        const [data, total] = await Promise.all([
          Product.find(filter)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('groupId', 'name')
            .lean(),
          Product.countDocuments(filter),
        ]);
        return { data, total, page, limit };
      },
    });

    // Get single product
    server.route({
      method: 'GET',
      path: '/products/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
        },
      },
      async handler(request) {
        const product = await Product.findById(request.params.id)
          .populate('groupId', 'name')
          .lean();
        if (!product) throw Boom.notFound('Product not found');
        return product;
      },
    });

    // Create product
    server.route({
      method: 'POST',
      path: '/products',
      options: {
        validate: {
          payload: Joi.object({
            name: Joi.string().trim().required(),
            groupId: Joi.string().length(24).required(),
            price: Joi.number().min(0).required(),
            unit: Joi.string().trim().default('pcs'),
            description: Joi.string().allow('').default(''),
            active: Joi.boolean().default(true),
          }),
        },
      },
      async handler(request, h) {
        const product = new Product(request.payload);
        await product.save();
        await product.populate('groupId', 'name');
        return h.response(product).code(201);
      },
    });

    // Update product
    server.route({
      method: 'PUT',
      path: '/products/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
          payload: Joi.object({
            name: Joi.string().trim().optional(),
            groupId: Joi.string().length(24).optional(),
            price: Joi.number().min(0).optional(),
            unit: Joi.string().trim().optional(),
            description: Joi.string().allow('').optional(),
            active: Joi.boolean().optional(),
          }),
        },
      },
      async handler(request) {
        const product = await Product.findByIdAndUpdate(
          request.params.id,
          { $set: request.payload },
          { new: true, runValidators: true },
        )
          .populate('groupId', 'name')
          .lean();
        if (!product) throw Boom.notFound('Product not found');
        return product;
      },
    });

    // Delete product
    server.route({
      method: 'DELETE',
      path: '/products/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().length(24).required() }),
        },
      },
      async handler(request, h) {
        const product = await Product.findByIdAndDelete(request.params.id).lean();
        if (!product) throw Boom.notFound('Product not found');
        return h.response().code(204);
      },
    });
  },
};

export default productsRoute;
