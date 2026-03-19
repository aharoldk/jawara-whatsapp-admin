const authService  = require('../services/AuthService');
const asyncHandler = require('../utils/asyncHandler');

const authRoutes = [
  // ── Register Tenant ─────────────────────────────────────────────────────
  // DISABLED: Tenant dibuat via script di server, bukan via API publik.
  // Lihat: npm run create-tenant -- --help
  // Atau: docs/TENANT_MANAGEMENT.md

  // ── Login (public) ───────────────────────────────────────────────────────
  {
    method : 'POST',
    path   : '/api/auth/login',
    options: { auth: false },
    handler: asyncHandler(async (request, h) => {
      const { email, password }  = request.payload;
      const subdomain            = request.headers['x-tenant-subdomain'];

      if (!subdomain) {
        const Boom = require('@hapi/boom');
        throw Boom.badRequest('Header X-Tenant-Subdomain wajib disertakan');
      }

      const { user, tenant, token } = await authService.login({ email, password, subdomain });

      return {
        success: true,
        message: 'Login berhasil',
        data   : { user, tenant, token }
      };
    })
  },

  // ── Me (protected) ───────────────────────────────────────────────────────
  {
    method : 'GET',
    path   : '/api/auth/me',
    handler: asyncHandler(async (request, h) => {
      const user = await authService.getProfile(
        request.app.tenantId,
        request.app.user.id
      );
      return { success: true, data: user };
    })
  }
];

module.exports = authRoutes;
