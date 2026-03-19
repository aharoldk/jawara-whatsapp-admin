const customerService = require('../services/CustomerService');
const asyncHandler    = require('../utils/asyncHandler');

const customerRoutes = [
  {
    method: 'GET', path: '/api/customers',
    handler: asyncHandler(async (req, h) => {
      const tid = req.app.tenantId;
      const { status, tag, search, page, limit, sortBy, sortOrder } = req.query;
      const filter  = {};
      if (status) filter.status = status;
      if (tag)    filter.tag    = tag;
      if (search) filter.search = search;
      const options = {
        page : parseInt(page)  || 1,
        limit: parseInt(limit) || 10,
        sort : sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 }
      };
      const result = await customerService.getAllCustomers(tid, filter, options);
      return { success: true, data: result.customers, pagination: result.pagination };
    })
  },
  {
    method: 'GET', path: '/api/customers/{id}',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.getCustomerById(req.app.tenantId, req.params.id);
      return { success: true, data: customer };
    })
  },
  {
    method: 'POST', path: '/api/customers',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.createCustomer(req.app.tenantId, req.payload);
      return h.response({ success: true, data: customer, message: 'Customer berhasil ditambahkan' }).code(201);
    })
  },
  {
    method: 'PUT', path: '/api/customers/{id}',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.updateCustomer(req.app.tenantId, req.params.id, req.payload);
      return { success: true, data: customer, message: 'Customer berhasil diperbarui' };
    })
  },
  {
    method: 'DELETE', path: '/api/customers/{id}',
    handler: asyncHandler(async (req, h) => {
      const result = await customerService.deleteCustomer(req.app.tenantId, req.params.id);
      return { success: true, message: result.message };
    })
  },
  {
    method: 'POST', path: '/api/customers/{id}/tags',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.addTag(req.app.tenantId, req.params.id, req.payload.tag);
      return { success: true, data: customer };
    })
  },
  {
    method: 'DELETE', path: '/api/customers/{id}/tags/{tag}',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.removeTag(req.app.tenantId, req.params.id, req.params.tag);
      return { success: true, data: customer };
    })
  },
  {
    method: 'PUT', path: '/api/customers/{id}/data',
    handler: asyncHandler(async (req, h) => {
      const customer = await customerService.updateCustomerData(req.app.tenantId, req.params.id, req.payload);
      return { success: true, data: customer };
    })
  }
];

module.exports = customerRoutes;
