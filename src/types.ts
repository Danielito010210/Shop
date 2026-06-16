export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  isOnSale?: boolean;
  discountPercent?: number;
  currency?: string; // Optional product-level currency selection, e.g. 'CUP', 'USD', 'EUR', 'MLC'
}

export type UserRole = 'admin' | 'gerente' | 'employee';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string; // Stored as SHA-256 hashed string
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  blockedUntil?: string; // ISO String when blocking expires
}

export interface StoreConfig {
  storeName: string;
  contactNumber: string;
  workingHours: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
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
