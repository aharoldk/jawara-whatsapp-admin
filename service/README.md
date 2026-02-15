# WhatsApp Admin

A Node.js application for WhatsApp administration built with Clean Architecture principles using Hapi.js and Mongoose.

## Technology Stack

- **Hapi.js** - Web framework
- **Mongoose** - MongoDB ODM
- **Boom** - HTTP-friendly error objects
- **Node.js** - Runtime environment

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update the environment variables, especially `DATABASE_URL`

```bash
cp .env.example .env
```

## Database Setup

Make sure MongoDB is running. You can:
- Install MongoDB locally
- Use MongoDB Atlas (cloud)
- Use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

Update `DATABASE_URL` in `.env` file:
```
DATABASE_URL=mongodb://localhost:27017/whatsapp_admin
```

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## Architecture

This application follows **Clean Architecture** principles with clear separation of concerns:

### Layers

1. **Models** - Mongoose schemas representing domain entities
2. **Repositories** - Data access layer (abstracts Mongoose operations)
3. **Services** - Business logic layer (implements use cases)
4. **Routes** - Hapi route handlers (presentation layer)
5. **Middleware** - Hapi plugins for cross-cutting concerns

## API Endpoints

### General
- `GET /` - API information
- `GET /api/health` - Health check

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## API Examples

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user"
  }'
```

### Create a Customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "whatsappNo": "+1234567890",
    "address": "123 Main St, New York, NY 10001, USA",
    "payload": {
      "customerId": "CUST001",
      "preferences": {
        "language": "en",
        "notifications": true
      }
    },
    "tags": ["vip", "premium"],
    "status": "active"
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response (using Boom)
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## Development

### Adding New Features

1. **Model** - Create Mongoose schema in `src/models/`
2. **Repository** - Implement data access in `src/repositories/`
3. **Service** - Add business logic in `src/services/`
4. **Routes** - Define Hapi routes in `src/routes/`

### Example: Adding a Product Feature

1. **Create Model** (`src/models/Product.js`)
   ```javascript
   const mongoose = require('mongoose');
   
   const productSchema = new mongoose.Schema({
     name: { type: String, required: true },
     price: { type: Number, required: true }
   }, { timestamps: true });
   
   module.exports = mongoose.model('Product', productSchema);
   ```

2. **Create Repository** (`src/repositories/ProductRepository.js`)
   ```javascript
   const Product = require('../models/Product');
   
   class ProductRepository {
     async findAll() {
       return await Product.find({});
     }
   }
   
   module.exports = new ProductRepository();
   ```

3. **Create Service** (`src/services/ProductService.js`)
   ```javascript
   const productRepository = require('../repositories/ProductRepository');
   
   class ProductService {
     async getAllProducts() {
       return await productRepository.findAll();
     }
   }
   
   module.exports = new ProductService();
   ```

4. **Create Routes** (`src/routes/productRoutes.js`)
   ```javascript
   const productService = require('../services/ProductService');
   
   const productRoutes = [
     {
       method: 'GET',
       path: '/api/products',
       handler: async (request, h) => {
         const products = await productService.getAllProducts();
         return { success: true, data: products };
       }
     }
   ];
   
   module.exports = productRoutes;
   ```

5. **Register Routes** (`src/routes/index.js`)
   ```javascript
   const productRoutes = require('./productRoutes');
   // Add to routes array
   ...productRoutes
   ```

## Error Handling

The application uses `@hapi/boom` for HTTP-friendly error objects:

- `Boom.badRequest()` - 400 Bad Request
- `Boom.unauthorized()` - 401 Unauthorized
- `Boom.forbidden()` - 403 Forbidden
- `Boom.notFound()` - 404 Not Found
- `Boom.conflict()` - 409 Conflict
- `Boom.internal()` - 500 Internal Server Error

## Features

- ✅ Clean Architecture implementation
- ✅ Hapi.js web framework
- ✅ Mongoose ODM with MongoDB
- ✅ Repository pattern for data access
- ✅ Service layer for business logic
- ✅ Boom error handling
- ✅ AsyncHandler for automatic error handling in routes
- ✅ Request/Response logging
- ✅ CORS support
- ✅ Graceful shutdown
- ✅ Environment-based configuration
- ✅ WAHA (WhatsApp HTTP API) integration
- ✅ Docker & Docker Compose support
- ✅ Webhook support for WhatsApp events

## Docker Deployment

See [DOCKER.md](DOCKER.md) for detailed Docker setup and deployment instructions.

### Quick Start with Docker

**Development (MongoDB + WAHA only):**
```bash
npm run docker:dev:up
npm run dev
```

**Production (All services):**
```bash
npm run docker:up
```

**View logs:**
```bash
npm run docker:logs
```

**Stop services:**
```bash
npm run docker:down
```

## Notes

- Routes directly call services (no controller layer)
- All database operations use Mongoose
- Error handling is centralized using Boom
- Authentication middleware is available but commented out
- Add JWT authentication in `src/middleware/auth.js` as needed

## License

ISC

