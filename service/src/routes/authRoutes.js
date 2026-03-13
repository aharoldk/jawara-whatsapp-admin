const authService = require('../services/AuthService');
const asyncHandler = require('../utils/asyncHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/api/auth/register',
    options: { auth: false },
    handler: asyncHandler(async (request, h) => {
      const { name, email, password, phone, role } = request.payload;
      const { user, token } = await authService.register({ name, email, password, phone, role });
      return h.response({
        success: true,
        message: 'Registration successful',
        data: { user, token }
      }).code(201);
    })
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    options: { auth: false },
    handler: asyncHandler(async (request, h) => {
      const { email, password } = request.payload;
      const { user, token } = await authService.login({ email, password });
      return {
        success: true,
        message: 'Login successful',
        data: { user, token }
      };
    })
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    handler: asyncHandler(async (request, h) => {
      const user = await authService.getProfile(request.app.user.id);
      return { success: true, data: user };
    })
  }
];

module.exports = authRoutes;
