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
        sort: {}
      };

      if (sortBy) {
        options.sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        options.sort = { createdAt: -1 };
      }

      const result = await customerService.getAllCustomers(filter, options);
      return {
        success: true,
        data: result.customers,
        pagination: result.pagination
      };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.getCustomerById(request.params.id);
      return {
        success: true,
        data: customer
      };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/whatsapp/{whatsappNo}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.getCustomerByWhatsappNo(request.params.whatsappNo);
      return {
        success: true,
        data: customer
      };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/search/{term}',
    handler: asyncHandler(async (request, h) => {
      const customers = await customerService.searchCustomers(request.params.term);
      return {
        success: true,
        data: customers
      };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/tag/{tag}',
    handler: asyncHandler(async (request, h) => {
      const customers = await customerService.getCustomersByTag(request.params.tag);
      return {
        success: true,
        data: customers
      };
    })
  },
  {
    method: 'GET',
    path: '/api/customers/status/{status}',
    handler: asyncHandler(async (request, h) => {
      const customers = await customerService.getCustomersByStatus(request.params.status);
      return {
        success: true,
        data: customers
      };
    })
  },
  {
    method: 'POST',
    path: '/api/customers',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.createCustomer(request.payload);
      return h.response({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      }).code(201);
    })
  },
  {
    method: 'PUT',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.updateCustomer(request.params.id, request.payload);
      return {
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      };
    })
  },
  {
    method: 'PATCH',
    path: '/api/customers/{id}/payload',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.updatePayload(request.params.id, request.payload);
      return {
        success: true,
        data: customer,
        message: 'Customer payload updated successfully'
      };
    })
  },
  {
    method: 'DELETE',
    path: '/api/customers/{id}',
    handler: asyncHandler(async (request, h) => {
      const result = await customerService.deleteCustomer(request.params.id);
      return {
        success: true,
        message: result.message
      };
    })
  },
  {
    method: 'POST',
    path: '/api/customers/{id}/tags',
    handler: asyncHandler(async (request, h) => {
      const { tag } = request.payload;
      const customer = await customerService.addTagToCustomer(request.params.id, tag);
      return {
        success: true,
        data: customer,
        message: 'Tag added successfully'
      };
    })
  },
  {
    method: 'DELETE',
    path: '/api/customers/{id}/tags/{tag}',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.removeTagFromCustomer(
        request.params.id,
        request.params.tag
      );
      return {
        success: true,
        data: customer,
        message: 'Tag removed successfully'
      };
    })
  },
  {
    method: 'PATCH',
    path: '/api/customers/{id}/last-contacted',
    handler: asyncHandler(async (request, h) => {
      const customer = await customerService.updateLastContacted(request.params.id);
      return {
        success: true,
        data: customer,
        message: 'Last contacted timestamp updated'
      };
    })
  }
];

module.exports = customerRoutes;

