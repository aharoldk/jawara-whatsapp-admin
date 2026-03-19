const settingService = require('../services/SettingService');
const asyncHandler   = require('../utils/asyncHandler');

const settingsRoutes = [
  {
    method: 'GET', path: '/api/settings',
    handler: asyncHandler(async (req, h) => {
      const settings = await settingService.getSettings(req.app.tenantId);
      return { success: true, data: settings };
    })
  },
  {
    method: 'PUT', path: '/api/settings',
    handler: asyncHandler(async (req, h) => {
      const settings = await settingService.updateSettings(req.app.tenantId, req.payload);
      return { success: true, data: settings, message: 'Settings berhasil disimpan' };
    })
  }
];

module.exports = settingsRoutes;
