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
  submenus?: string[];
  code?: number; // short product code shown as VU-1001 (admin list, product page, WhatsApp) // stone subcategories under a menu (e.g. Hematit under Erkek Yüzük)
  /** bumped in the catalogue when its image set changes; the admin panel then
   *  copies the new image list to Firestore once */
  imagesVersion?: number;
  originalUrl?: string;
  createdAt?: string;
  updatedAt?: string; // last change, for the "last edited" sort in admin
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

/* ---------- Atölye (workshop) ---------- */

/** Workshop-only details of a ring case. Same id as its StockGroup; kept in an
 *  admin-only collection because stockGroups is publicly readable. */
export interface WorkshopCase {
  id: string;
  /** short case code, e.g. "K-001"; editable */
  code: string;
  /** silver weight of one cast case, in grams */
  gram?: number;
  /** below or at this count the case shows as "azaldı" (reorder) */
  minStock?: number;
  /** casters who make this case */
  casterIds?: string[];
  note?: string;
  /** other cost of one finished ring besides silver and casting (polish, box…), TL */
  extraCost?: number;
  /** stone cost per variant (product id → TL) */
  stoneCosts?: Record<string, number>;
}

/** A caster (dökümcü) the workshop sends silver to */
export interface Caster {
  id: string;
  name: string;
  phone?: string;
  /** labour per gram, TL */
  laborPerGram?: number;
  /** fineness of the cast silver, e.g. 925 */
  milyem?: number;
  /** casting loss the caster charges, percent of the pure silver used */
  firePercent?: number;
  note?: string;
}

export type MovementType = "dokum" | "uretim" | "satis" | "fire" | "iade" | "sayim";

export type SaleChannel = "dukkan" | "instagram" | "whatsapp" | "diger";
export type PaymentMethod = "nakit" | "kart" | "havale" | "diger";

/** One line in the workshop ledger. Stock-changing lines update the case stock
 *  in the same transaction. */
export interface StockMovement {
  id: string;
  type: MovementType;
  groupId: string;
  groupName: string;
  caseCode?: string;
  /** number of pieces the line is about (always positive) */
  qty: number;
  /** change applied to the case stock (+ in, − out, 0 for uretim) */
  delta: number;
  stockAfter: number;
  productId?: string;
  productTitle?: string;
  productCode?: number;
  casterId?: string;
  casterName?: string;
  /** total grams delivered by the caster (dokum) */
  grams?: number;
  /** total sale amount, TL (satis) */
  amount?: number;
  channel?: SaleChannel;
  payment?: PaymentMethod;
  note?: string;
  /** casting order this delivery belongs to */
  castOrderId?: string;
  /** caster account line written with this delivery */
  ledgerId?: string;
  /** ISO time */
  at: string;
  by?: string;
}

export type CastOrderStatus = "verildi" | "kismi" | "teslim" | "iptal";

export interface CastOrderLine {
  groupId: string;
  groupName: string;
  caseCode?: string;
  qty: number;
  received?: number;
}

/** An order of cases sent to a caster */
export interface CastOrder {
  id: string;
  casterId: string;
  casterName: string;
  lines: CastOrderLine[];
  status: CastOrderStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  by?: string;
}

/** Caster account: pure silver (has) in grams and labour in TL.
 *  hasVerildi: we gave pure silver (+gram at caster)
 *  teslim: caster delivered cases (−gram used, +TL labour owed)
 *  hasIade: caster returned pure silver to us (−gram)
 *  odeme: we paid labour (−TL owed)
 *  duzeltme: manual correction of either */
export type CasterLedgerType = "hasVerildi" | "teslim" | "hasIade" | "odeme" | "duzeltme";

export interface CasterLedgerLine {
  id: string;
  casterId: string;
  casterName: string;
  type: CasterLedgerType;
  /** change of pure silver held by the caster, grams (+ more at caster) */
  hasGram: number;
  /** change of labour we owe, TL (+ we owe more) */
  tl: number;
  /** delivered 925 grams (teslim) */
  grams?: number;
  castOrderId?: string;
  movementId?: string;
  note?: string;
  at: string;
  by?: string;
}

/** Admin-only workshop settings (settings/workshop) */
export interface WorkshopSettings {
  /** price of 1 gram pure silver, TL */
  hasPrice?: number;
  hasPriceAt?: string;
  /** recent prices, newest first */
  hasPriceHistory?: { price: number; at: string }[];
}
