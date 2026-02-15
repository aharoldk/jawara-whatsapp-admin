const Boom = require('@hapi/boom');

/**
 * Async handler wrapper for Hapi routes
 * Catches errors from async handlers and converts them to Boom errors
 */
const asyncHandler = (fn) => {
  return async (request, h) => {
    try {
      return await fn(request, h);
    } catch (error) {
      // If it's already a Boom error, throw it as is
      if (error.isBoom) {
        throw error;
      }

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        throw Boom.badRequest(error.message);
      }

      // Handle Mongoose cast errors (invalid ObjectId, etc.)
      if (error.name === 'CastError') {
        throw Boom.badRequest(`Invalid ${error.path}: ${error.value}`);
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw Boom.conflict(`${field} already exists`);
      }

      // Default to internal server error
      console.error('Unhandled error:', error);
      throw Boom.internal(error.message);
    }
  };
};

module.exports = asyncHandler;

