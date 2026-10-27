export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  name?: string;
  createdAt?: string;
}

export interface Product {
  id?: string;
  title: string;
  title_en?: string;
  title_es?: string;
  title_de?: string;
  title_ar?: string;
  title_ru?: string;
  description: string;
  description_en?: string;
  description_es?: string;
  description_de?: string;
  description_ar?: string;
  description_ru?: string;
  /** translationSourceKey of the Turkish text the stored translations were made from */
  i18nSource?: string;
  /** set by the admin form when the piece was given text of its own; the hand-written
   *  catalogue text is then no longer shown in its place */
  customText?: boolean;
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
  /** price shown to signed-in members (lower than price) */
  memberPrice?: number;
  /** header menus this piece appears under; empty = guessed from its category */
  menus?: string[];
  submenus?: string[]; // stone subcategories under a menu (e.g. Hematit under Erkek Yüzük)
  /** bumped in the catalogue when its image set changes; the admin panel then
   *  copies the new image list to Firestore once */
  imagesVersion?: number;
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
