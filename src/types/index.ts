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
  /** translationSourceKey of the Turkish text the stored translations were made from */
  i18nSource?: string;
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
  /** id of a shared stock group (e.g. the "Sidre" ring case); when set, the
   *  group's stock is what can be sold and every sale draws from it */
  stockGroup?: string;
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
  /** stock taken by this order, so it can be returned if the order is cancelled */
  stockDeductions?: StockDeductions;
  restocked?: boolean;
}

export interface StockDeductions {
  groups: Record<string, number>;
  products: Record<string, number>;
}

/** A shared stock pool, e.g. one ring case sold with different stones */
export interface StockGroup {
  id: string;
  name: string;
  stock: number;
}
