const User = require('../models/User');

class UserRepository {
  async findAll(tenantId, filter = {}, options = {}) {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip  = (page - 1) * limit;
      const query = this.buildQuery(tenantId, filter);
  
      const [users, total] = await Promise.all([
        User.find(query).sort(sort).skip(skip).limit(limit),
        User.countDocuments(query)
      ]);
  
      return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

  async findById(tenantId, id) {
    return User.findOne({ _id: id, tenantId });
  }

  async findByEmail(tenantId, email) {
    return User.findOne({ tenantId, email: email.toLowerCase() });
  }

  async create(tenantId, userData) {
    return User.create({ ...userData, tenantId });
  }

  async update(tenantId, id, userData) {
    return User.findOneAndUpdate(
      { _id: id, tenantId }, userData, { new: true, runValidators: true }
    );
  }

  async delete(tenantId, id) {
    const result = await User.findOneAndDelete({ _id: id, tenantId });
    return result !== null;
  }

  buildQuery(tenantId, filter) {
    const query = { tenantId };
    if (filter.status)    query.status    = filter.status;
    if (filter.frequency) query.frequency = filter.frequency;
    if (filter.search)    query.$or = [
      { name   : { $regex: filter.search, $options: 'i' } },
      { message: { $regex: filter.search, $options: 'i' } }
    ];
    return query;
  }
}

module.exports = new UserRepository();
