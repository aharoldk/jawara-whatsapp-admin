const Customer = require('../models/Customer');

class CustomerRepository {
  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = this.buildQuery(filter);

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query)
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id) {
    return await Customer.findById(id);
  }

  async findByWhatsappNo(whatsappNo) {
    // Normalize WhatsApp number
    const normalized = whatsappNo.replace(/\D/g, '');
    return await Customer.findOne({
      whatsappNo: { $regex: normalized, $options: 'i' }
    });
  }

  async searchByName(name) {
    return await Customer.find({
      $text: { $search: name }
    }).limit(20);
  }

  async findByTag(tag) {
    return await Customer.find({ tags: tag });
  }

  async findByStatus(status) {
    return await Customer.find({ status });
  }

  async create(customerData) {
    const customer = new Customer(customerData);
    return await customer.save();
  }

  async update(id, customerData) {
    return await Customer.findByIdAndUpdate(
      id,
      customerData,
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    const result = await Customer.findByIdAndDelete(id);
    return result !== null;
  }

  async addTag(id, tag) {
    return await Customer.findByIdAndUpdate(
      id,
      { $addToSet: { tags: tag } },
      { new: true }
    );
  }

  async removeTag(id, tag) {
    return await Customer.findByIdAndUpdate(
      id,
      { $pull: { tags: tag } },
      { new: true }
    );
  }

  async updateLastContacted(id) {
    return await Customer.findByIdAndUpdate(
      id,
      { lastContactedAt: new Date() },
      { new: true }
    );
  }

  buildQuery(filter) {
    const query = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.tag) {
      query.tags = filter.tag;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { whatsappNo: { $regex: filter.search, $options: 'i' } },
        { address: { $regex: filter.search, $options: 'i' } }
      ];
    }

    return query;
  }
}

module.exports = new CustomerRepository();

