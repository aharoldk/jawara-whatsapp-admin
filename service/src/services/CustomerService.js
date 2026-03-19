const customerRepository = require('../repositories/CustomerRepository');
const Boom = require('@hapi/boom');

class CustomerService {
  async getAllCustomers(tenantId, filter = {}, options = {}) {
    return customerRepository.findAll(tenantId, filter, options);
  }

  async getCustomerById(tenantId, id) {
    try {
      const customer = await customerRepository.findById(tenantId, id);
      if (!customer) throw Boom.notFound('Customer tidak ditemukan');
      return customer;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID customer tidak valid');
      throw e;
    }
  }

  async createCustomer(tenantId, data) {
    try {
      const existing = await customerRepository.findByWhatsappNumber(tenantId, data.whatsappNumber);
      if (existing) throw Boom.conflict('Nomor WhatsApp sudah terdaftar');
      return customerRepository.create(tenantId, data);
    } catch (e) {
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      if (e.code === 11000) throw Boom.conflict('Nomor WhatsApp sudah terdaftar');
      throw e;
    }
  }

  async updateCustomer(tenantId, id, data) {
    try {
      const existing = await customerRepository.findById(tenantId, id);
      if (!existing) throw Boom.notFound('Customer tidak ditemukan');
      if (data.whatsappNumber && data.whatsappNumber !== existing.whatsappNumber) {
        const dup = await customerRepository.findByWhatsappNumber(tenantId, data.whatsappNumber);
        if (dup && String(dup._id) !== String(id)) throw Boom.conflict('Nomor WhatsApp sudah digunakan');
      }
      const updated = await customerRepository.update(tenantId, id, data);
      if (!updated) throw Boom.notFound('Customer tidak ditemukan');
      return updated;
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID customer tidak valid');
      if (e.name === 'ValidationError') throw Boom.badRequest(e.message);
      throw e;
    }
  }

  async deleteCustomer(tenantId, id) {
    try {
      const customer = await customerRepository.findById(tenantId, id);
      if (!customer) throw Boom.notFound('Customer tidak ditemukan');
      await customerRepository.delete(tenantId, id);
      return { message: 'Customer berhasil dihapus' };
    } catch (e) {
      if (e.name === 'CastError') throw Boom.badRequest('ID customer tidak valid');
      throw e;
    }
  }

  async addTag(tenantId, id, tag) {
    const customer = await customerRepository.findById(tenantId, id);
    if (!customer) throw Boom.notFound('Customer tidak ditemukan');
    return customerRepository.addTag(tenantId, id, tag);
  }

  async removeTag(tenantId, id, tag) {
    const customer = await customerRepository.findById(tenantId, id);
    if (!customer) throw Boom.notFound('Customer tidak ditemukan');
    return customerRepository.removeTag(tenantId, id, tag);
  }

  async updateCustomerData(tenantId, id, data) {
    const customer = await customerRepository.findById(tenantId, id);
    if (!customer) throw Boom.notFound('Customer tidak ditemukan');
    const mergedData = { ...(customer.data?.toObject?.() || customer.data || {}), ...data };
    return customerRepository.update(tenantId, id, { data: mergedData });
  }
}

module.exports = new CustomerService();
