const settingRepository = require('../repositories/SettingRepository');
const Boom              = require('@hapi/boom');

class SettingService {
  async getSettings(tenantId) {
    return settingRepository.get(tenantId);
  }

  async updateSettings(tenantId, payload) {
    const { customerFieldTemplate, broadcastDefaults } = payload;
    if (customerFieldTemplate) {
      const keys = customerFieldTemplate.map(f => f.key);
      if (keys.length !== new Set(keys).size)
        throw Boom.badRequest('Terdapat key field yang duplikat');
      for (const f of customerFieldTemplate) {
        if (!f.key || !f.label)
          throw Boom.badRequest('Setiap field harus memiliki key dan label');
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.key))
          throw Boom.badRequest(`Key "${f.key}" tidak valid`);
        if (f.type === 'select' && !f.options?.length)
          throw Boom.badRequest(`Field "${f.label}" tipe select butuh minimal satu opsi`);
      }
    }
    return settingRepository.update(tenantId, { customerFieldTemplate, broadcastDefaults });
  }
}

module.exports = new SettingService();
