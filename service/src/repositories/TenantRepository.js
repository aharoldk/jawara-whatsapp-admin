const Tenant = require('../models/Tenant');

class TenantRepository {
  async findBySubdomain(subdomain) {
    return Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  }

  async findById(id) {
    return Tenant.findById(id);
  }

  async create(data) {
    return Tenant.create(data);
  }

  async isSubdomainTaken(subdomain) {
    const exists = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    return !!exists;
  }

  async updateStatus(id, status) {
    return Tenant.findByIdAndUpdate(id, { status }, { new: true });
  }
}

module.exports = new TenantRepository();
