const customerService = require('../services/CustomerService');
const asyncHandler = require('../utils/asyncHandler');

const customerRoutes = [
  {
    method: 'GET',
    path: '/api/customers',
    handler: asyncHandler(async (request, h) => {
      const { status, tag, search, page, limit, sortBy, sortOrder } = request.query;
      const filter = {};
      if (status) filter.status = status;
      if (tag) filter.tag = tag;
      if (search) filter.search = search;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 }
      };

      const result = await customerService.getAllCustomers(filter, options);
      return { success: true, data: result.customers, pagination: result.pagination };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.getCustomerById(request.params.id);
      return { success: true, data: customer };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/whatsapp/{whatsappNumber}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.getCustomerByWhatsappNumber(request.params.whatsappNumber);
      return { success: true, data: customer };
    })
  },
  {
    method: 'POST',
    path: '/api/customers',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.createCustomer(request.payload);
      return h.response({ success: true, data: customer, message: 'Customer created successfully' }).code(201);
    })
  },
  {
    method: 'PUT',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.updateCustomer(request.params.id, request.payload);
      return { success: true, data: customer, message: 'Customer updated successfully' };
    })
  },
  {
    method: 'PUT',
    path: '/api/customers/{id}/data',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.updateCustomerData(request.params.id, request.payload);
      return { success: true, data: customer, message: 'Customer data updated successfully' };
    })
  },
  {
    method: 'DELETE',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const result = await customerService.deleteCustomer(request.params.id);
      return { success: true, message: result.message };
    })
  },
  {
    method: 'POST',
    path: '/api/customers/{id}/tags',
    handler: asyncHandler(async (request, h) => {
      const { tag } = request.payload;
      const customer = await customerService.addTagToCustomer(request.params.id, tag);
      return { success: true, data: customer, message: 'Tag added successfully' };
    })
  },
  {
    method: 'DELETE',
    path: '/api/customers/{id}/tags/{tag}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.removeTagFromCustomer(request.params.id, request.params.tag);
      return { success: true, data: customer, message: 'Tag removed successfully' };
    })
  }
];

module.exports = customerRoutes;
