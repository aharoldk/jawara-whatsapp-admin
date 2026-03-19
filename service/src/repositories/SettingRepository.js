const Setting = require('../models/Setting');

const DEFAULT_VALUE = {
  customerFieldTemplate: [],
  broadcastDefaults: {
    baseDelayMs    : 5000,
    jitterMs       : 3000,
    pauseEvery     : 20,
    pauseDurationMs: 60000
  }
};

class SettingRepository {
  async get(tenantId) {
    let doc = await Setting.findOne({ tenantId });
    if (!doc) {
      doc = await Setting.create({ tenantId, value: DEFAULT_VALUE });
    }
    return doc.value;
  }

  async update(tenantId, partial) {
    const current = await this.get(tenantId);

    const merged = {
      customerFieldTemplate: partial.customerFieldTemplate ?? current.customerFieldTemplate,
      broadcastDefaults    : partial.broadcastDefaults
        ? { ...current.broadcastDefaults, ...partial.broadcastDefaults }
        : current.broadcastDefaults
    };

    const doc = await Setting.findOneAndUpdate(
      { tenantId },
      { $set: { value: merged } },
      { new: true, upsert: true, runValidators: true }
    );

    return doc.value;
  }
}

module.exports = new SettingRepository();
