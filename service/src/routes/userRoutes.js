const userService = require('../services/UserService');
const asyncHandler = require('../utils/asyncHandler');

const userRoutes = [
  {
    method: 'GET',
    path: '/api/users',
    handler: asyncHandler(async (request, h) => {
      const users = await userService.getAllUsers();
      return {
        success: true,
        data: users
      };
    })
  },
  {
    method: 'GET',
    path: '/api/users/{id}',
    handler: asyncHandler(async (request, h) => {
      const user = await userService.getUserById(request.params.id);
      return {
        success: true,
        data: user
      };
    })
  },
  {
    method: 'POST',
    path: '/api/users',
    handler: asyncHandler(async (request, h) => {
      const user = await userService.createUser(request.payload);
      return h.response({
        success: true,
        data: user,
        message: 'User created successfully'
      }).code(201);
    })
  },
  {
    method: 'PUT',
    path: '/api/users/{id}',
    handler: asyncHandler(async (request, h) => {
      const user = await userService.updateUser(request.params.id, request.payload);
      return {
        success: true,
        data: user,
        message: 'User updated successfully'
      };
    })
  },
  {
    method: 'DELETE',
    path: '/api/users/{id}',
    handler: asyncHandler(async (request, h) => {
      const result = await userService.deleteUser(request.params.id);
      return {
        success: true,
        message: result.message
      };
    })
  }
];

module.exports = userRoutes;

