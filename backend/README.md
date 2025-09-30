# E-commerce Backend

A modern e-commerce backend built with Go, Fiber, and MongoDB.

## Features

- JWT Authentication with refresh tokens
- Role-based access control (Customer, Admin, Delivery)
- Product management (CRUD)
- Shopping cart functionality
- Order management
- User management
- Delivery tracking

## Setup

1. Install dependencies:

```bash
go mod tidy
```

2. Set environment variables:

```bash
export PORT=8080
export MONGO_URI=mongodb://localhost:27017
export MONGO_DB=ecom
export JWT_SECRET=your-super-secret-jwt-key
export FRONTEND_URL=http://localhost:3000
```

3. Run the server:

```bash
go run cmd/main.go
```

## Demo Accounts

- **Admin**: admin@demo.com / Admin@123
- **Delivery**: delivery@demo.com / Delivery@123

## API Endpoints

### Authentication

- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - User logout
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/password` - Change password

### Products

- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get product by ID
- POST `/api/products` - Create product (Admin only)
- PUT `/api/products/:id` - Update product (Admin only)
- DELETE `/api/products/:id` - Delete product (Admin only)

### Cart

- GET `/api/cart` - Get user cart
- POST `/api/cart` - Add item to cart
- PUT `/api/cart/:productId` - Update cart item
- DELETE `/api/cart/:productId` - Remove item from cart
- DELETE `/api/cart` - Clear cart

### Orders

- POST `/api/orders` - Create order
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order by ID
- GET `/api/orders/all` - Get all orders (Admin only)
- PUT `/api/orders/:id/status` - Update order status (Admin only)

### Users (Admin only)

- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id/block` - Block user
- PUT `/api/users/:id/unblock` - Unblock user

### Delivery

- GET `/api/delivery/orders` - Get assigned orders
- PUT `/api/delivery/orders/:id/delivered` - Mark as delivered
