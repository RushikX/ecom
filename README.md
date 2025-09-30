# E-Commerce Full-Stack Application

A modern, full-stack e-commerce application built with Go (Fiber) backend and React frontend.

## Features

### Backend (Go + Fiber)

- JWT-based authentication with refresh tokens
- Role-based access control (Customer, Admin, Delivery Agent)
- MongoDB integration with Atlas support
- RESTful API endpoints
- Bcrypt password hashing
- CORS configuration

### Frontend (React + Vite)

- Modern UI with Tailwind CSS and shadcn/ui components
- Redux Toolkit for state management
- React Router for navigation
- Responsive design
- Skeleton loaders for better UX

### User Roles

- **Customer**: Browse products, manage cart, place orders, view order history
- **Admin**: Manage products, users, orders, assign delivery agents
- **Delivery Agent**: View assigned orders, mark as delivered

## Prerequisites

- Go 1.21+
- Node.js 18+
- MongoDB (local or Atlas)

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
go mod tidy
```

#### Environment Configuration

Create `.env.development` file in the backend directory:

```
PORT=8080
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ecom
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:5174
```

For production, create `.env.production`:

```
PORT=8080
MONGO_URI=your-mongodb-atlas-connection-string
MONGO_DB=ecom
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### Running the Backend

```bash
go run ./cmd/main.go
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

#### Environment Configuration

Create `.env.development` file in the frontend directory:

```
VITE_API_URL=http://localhost:8080/api
```

For production, create `.env.production`:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

#### Running the Frontend

```bash
npm run dev
```

## Demo Accounts

The application includes pre-configured demo accounts:

- **Admin**: `admin@demo.com` / `Admin@123`
- **Delivery Agent**: `delivery@demo.com` / `Delivery@123`
- **Customer**: Sign up with any email/password

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Cart

- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item
- `DELETE /api/cart/:productId` - Remove from cart
- `DELETE /api/cart` - Clear cart

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/all` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Users (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/block` - Block user
- `PUT /api/users/:id/unblock` - Unblock user
- `PUT /api/orders/:orderId/assign/:deliveryId` - Assign order to delivery agent

### Delivery

- `GET /api/delivery/orders` - Get assigned orders
- `PUT /api/delivery/orders/:id/delivered` - Mark order as delivered

## Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

## Project Structure

```
ecom/
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── models/
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Technologies Used

### Backend

- Go 1.21+
- Fiber web framework
- MongoDB with official driver
- JWT for authentication
- Bcrypt for password hashing
- CORS middleware

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Redux Toolkit
- React Router
- Axios for API calls
- Lucide React for icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
