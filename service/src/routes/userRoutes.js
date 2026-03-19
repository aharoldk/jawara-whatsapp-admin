const userService  = require('../services/UserService');
const asyncHandler = require('../utils/asyncHandler');

const userRoutes = [
  {
      method: 'GET', path: '/api/users',
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
        const result = await userService.getAllUsers(tid, filter, options);
        return { success: true, data: result.reminders, pagination: result.pagination };
      })
  },
  {
    method: 'GET', path: '/api/users/{id}',
    handler: asyncHandler(async (req, h) => {
      const user = await userService.getUserById(req.app.tenantId, req.params.id);
      return { success: true, data: user };
    })
  },
  {
    method: 'POST', path: '/api/users',
    handler: asyncHandler(async (req, h) => {
      const user = await userService.createUser(req.app.tenantId, req.payload);
      return h.response({ success: true, data: user, message: 'User berhasil ditambahkan' }).code(201);
    })
  },
  {
    method: 'PUT', path: '/api/users/{id}',
    handler: asyncHandler(async (req, h) => {
      const user = await userService.updateUser(req.app.tenantId, req.params.id, req.payload);
      return { success: true, data: user, message: 'User diperbarui' };
    })
  },
  {
    method: 'DELETE', path: '/api/users/{id}',
    handler: asyncHandler(async (req, h) => {
      const result = await userService.deleteUser(
        req.app.tenantId, req.params.id, req.app.user.id
      );
      return { success: true, message: result.message };
    })
  }
];

module.exports = userRoutes;
