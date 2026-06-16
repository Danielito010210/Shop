export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string; // Storing simple passwords for this offline-first system
}

export interface ClientDetails {
  name: string;
  phone: string;
  address: string;
  nickname?: string;
  reference?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'canceled';

export interface Order {
  id: string;
  invoiceNumber: string;
  clientDetails: ClientDetails;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  processedBy?: string;
}

export interface SecurityLog {
  id: string;
  username: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  failureReason: string;
}
