export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: Role;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  createdAt: string;
  items: OrderItem[];
}

export interface ApiResponse<T> {
  status: 'success';
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
