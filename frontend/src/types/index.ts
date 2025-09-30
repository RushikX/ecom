export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery';
  isActive: boolean;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  address: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface CreateOrderRequest {
  items: CartItem[];
  address: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[];
  category?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
}
