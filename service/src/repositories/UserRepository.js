const User = require('../models/User');

class UserRepository {
  async findAll() {
    return await User.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(
      id,
      userData,
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }
}

module.exports = new UserRepository();

