const customerRepository = require('../repositories/CustomerRepository');
const Boom = require('@hapi/boom');

class CustomerService {
  async getAllCustomers(filter = {}, options = {}) {
    return await customerRepository.findAll(filter, options);
  }

  async getCustomerById(id) {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) {
        throw Boom.notFound('Customer not found');
      }
      return customer;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }

  async getCustomerByWhatsappNo(whatsappNo) {
    const customer = await customerRepository.findByWhatsappNo(whatsappNo);
    if (!customer) {
      throw Boom.notFound('Customer not found with this WhatsApp number');
    }
    return customer;
  }

  async searchCustomers(searchTerm) {
    return await customerRepository.searchByName(searchTerm);
  }

  async getCustomersByTag(tag) {
    return await customerRepository.findByTag(tag);
  }

  async getCustomersByStatus(status) {
    const validStatuses = ['active', 'inactive', 'blocked'];
    if (!validStatuses.includes(status)) {
      throw Boom.badRequest('Invalid status. Must be: active, inactive, or blocked');
    }
    return await customerRepository.findByStatus(status);
  }

  async createCustomer(customerData) {
    try {
      // Check if WhatsApp number already exists
      const existing = await customerRepository.findByWhatsappNo(customerData.whatsappNo);
      if (existing) {
        throw Boom.conflict('Customer with this WhatsApp number already exists');
      }

      return await customerRepository.create(customerData);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      if (error.code === 11000) {
        throw Boom.conflict('Customer with this WhatsApp number already exists');
      }
      throw error;
    }
  }

  async updateCustomer(id, customerData) {
    try {
      const existing = await customerRepository.findById(id);
      if (!existing) {
        throw Boom.notFound('Customer not found');
      }

      // If WhatsApp number is being updated, check for duplicates
      if (customerData.whatsappNo && customerData.whatsappNo !== existing.whatsappNo) {
        const duplicate = await customerRepository.findByWhatsappNo(customerData.whatsappNo);
        if (duplicate && duplicate.id !== id) {
          throw Boom.conflict('Another customer with this WhatsApp number already exists');
        }
      }

      const updated = await customerRepository.update(id, customerData);
      if (!updated) {
        throw Boom.notFound('Customer not found');
      }

      return updated;
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }
      throw error;
    }
  }

  async deleteCustomer(id) {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) {
        throw Boom.notFound('Customer not found');
      }

      const deleted = await customerRepository.delete(id);
      if (!deleted) {
        throw Boom.internal('Failed to delete customer');
      }

      return { message: 'Customer deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }

  async addTagToCustomer(id, tag) {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) {
        throw Boom.notFound('Customer not found');
      }

      return await customerRepository.addTag(id, tag);
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }

  async removeTagFromCustomer(id, tag) {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) {
        throw Boom.notFound('Customer not found');
      }

      return await customerRepository.removeTag(id, tag);
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }

  async updateLastContacted(id) {
    try {
      return await customerRepository.updateLastContacted(id);
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }

  async updatePayload(id, payload) {
    try {
      const customer = await customerRepository.findById(id);
      if (!customer) {
        throw Boom.notFound('Customer not found');
      }

      // Merge existing payload with new data
      const mergedPayload = { ...customer.payload, ...payload };

      return await customerRepository.update(id, { payload: mergedPayload });
    } catch (error) {
      if (error.name === 'CastError') {
        throw Boom.badRequest('Invalid customer ID format');
      }
      throw error;
    }
  }
}

module.exports = new CustomerService();

