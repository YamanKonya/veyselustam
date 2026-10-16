export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Product {
  id?: string;
  title: string;
  title_en?: string;
  title_es?: string;
  title_de?: string;
  title_ar?: string;
  description: string;
  description_en?: string;
  description_es?: string;
  description_de?: string;
  description_ar?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isCampaign?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  images: string[];
  videoUrl?: string;
  category: string;
  ringSize: string[];
  stock: number;
  originalUrl?: string;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  ringSize?: string;
  image?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  notes?: string;
}

export interface Order {
  id?: string;
  userId: string;
  customerInfo: ShippingAddress;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}
