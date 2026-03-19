const Customer = require('../models/Customer');

class CustomerRepository {
  async findAll(tenantId, filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip  = (page - 1) * limit;
    const query = this.buildQuery(tenantId, filter);

    const [customers, total] = await Promise.all([
      Customer.find(query).sort(sort).skip(skip).limit(limit),
      Customer.countDocuments(query)
    ]);

    return {
      customers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findById(tenantId, id) {
    return Customer.findOne({ _id: id, tenantId });
  }

  async findByWhatsappNumber(tenantId, whatsappNumber) {
    const normalized = whatsappNumber.replace(/\D/g, '');
    return Customer.findOne({
      tenantId,
      whatsappNumber: { $regex: normalized, $options: 'i' }
    });
  }

  async findByTag(tenantId, tag) {
    return Customer.find({ tenantId, tags: tag });
  }

  async findByStatus(tenantId, status) {
    return Customer.find({ tenantId, status });
  }

  async create(tenantId, customerData) {
    return Customer.create({ ...customerData, tenantId });
  }

  async update(tenantId, id, customerData) {
    return Customer.findOneAndUpdate(
      { _id: id, tenantId },
      customerData,
      { new: true, runValidators: true }
    );
  }

  async delete(tenantId, id) {
    const result = await Customer.findOneAndDelete({ _id: id, tenantId });
    return result !== null;
  }

  async addTag(tenantId, id, tag) {
    return Customer.findOneAndUpdate(
      { _id: id, tenantId },
      { $addToSet: { tags: tag } },
      { new: true }
    );
  }

  async removeTag(tenantId, id, tag) {
    return Customer.findOneAndUpdate(
      { _id: id, tenantId },
      { $pull: { tags: tag } },
      { new: true }
    );
  }

  async updateLastContacted(tenantId, id) {
    return Customer.findOneAndUpdate(
      { _id: id, tenantId },
      { lastContactedAt: new Date() },
      { new: true }
    );
  }

  buildQuery(tenantId, filter) {
    const query = { tenantId };
    if (filter.status) query.status = filter.status;
    if (filter.tag)    query.tags   = filter.tag;
    if (filter.search) {
      query.$or = [
        { fullName      : { $regex: filter.search, $options: 'i' } },
        { whatsappNumber: { $regex: filter.search, $options: 'i' } },
        { address       : { $regex: filter.search, $options: 'i' } }
      ];
    }
    return query;
  }
}

module.exports = new CustomerRepository();
