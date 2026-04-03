import Joi from 'joi';
import Boom from '@hapi/boom';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.N8N_ENCRYPTION_KEY || 'change_me_jwt_secret';
const JWT_EXPIRES = '8h';

const usersRoute = {
  name: 'users',
  version: '1.0.0',
  register(server) {
    // ── Login (public) ────────────────────────────────────────────────────────
    server.route({
      method: 'POST',
      path: '/auth/login',
      options: {
        auth: false,
        validate: {
          payload: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required(),
          }),
        },
      },
      async handler(request, h) {
        const { username, password } = request.payload;
        const user = await User.findOne({ username: username.toLowerCase(), active: true });
        if (!user || !(await user.verifyPassword(password))) {
          throw Boom.unauthorized('Invalid username or password');
        }
        const token = jwt.sign(
          { sub: user._id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES },
        );
        return { token, user };
      },
    });

    // ── List users (protected) ────────────────────────────────────────────────
    server.route({
      method: 'GET',
      path: '/users',
      async handler() {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        return { data: users, total: users.length };
      },
    });

    // ── Get single user ───────────────────────────────────────────────────────
    server.route({
      method: 'GET',
      path: '/users/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().required() }) },
      },
      async handler(request) {
        const user = await User.findById(request.params.id).lean();
        if (!user) throw Boom.notFound('User not found');
        return user;
      },
    });

    // ── Create user ───────────────────────────────────────────────────────────
    server.route({
      method: 'POST',
      path: '/users',
      options: {
        validate: {
          payload: Joi.object({
            username: Joi.string().min(3).max(32).required(),
            password: Joi.string().min(8).required(),
            role: Joi.string().valid('admin', 'operator').default('operator'),
          }),
        },
      },
      async handler(request, h) {
        const exists = await User.findOne({ username: request.payload.username.toLowerCase() });
        if (exists) throw Boom.conflict('Username already taken');
        const user = new User(request.payload);
        await user.save();
        return h.response(user.toJSON()).code(201);
      },
    });

    // ── Update user ───────────────────────────────────────────────────────────
    server.route({
      method: 'PUT',
      path: '/users/{id}',
      options: {
        validate: {
          params: Joi.object({ id: Joi.string().required() }),
          payload: Joi.object({
            password: Joi.string().min(8).optional(),
            role: Joi.string().valid('admin', 'operator').optional(),
            active: Joi.boolean().optional(),
          }).min(1),
        },
      },
      async handler(request) {
        const user = await User.findById(request.params.id);
        if (!user) throw Boom.notFound('User not found');
        if (request.payload.password) user.password = request.payload.password;
        if (request.payload.role !== undefined) user.role = request.payload.role;
        if (request.payload.active !== undefined) user.active = request.payload.active;
        await user.save();
        return user.toJSON();
      },
    });

    // ── Delete user ───────────────────────────────────────────────────────────
    server.route({
      method: 'DELETE',
      path: '/users/{id}',
      options: {
        validate: { params: Joi.object({ id: Joi.string().required() }) },
      },
      async handler(request, h) {
        const user = await User.findByIdAndDelete(request.params.id);
        if (!user) throw Boom.notFound('User not found');
        return h.response().code(204);
      },
    });
  },
};

export default usersRoute;
