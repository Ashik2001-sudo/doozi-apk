export interface POSProduct {
  id: string;
  name: string;
  description?: string;
  productType: 'single' | 'variable';
  images: string[];
  status: string;
  hasSerialNumber?: boolean;
  variants: POSProductVariant[];
  category?: {
    id: string;
    name: string;
  };
  sellerBrand?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
}

export interface POSProductVariant {
  id: string;
  productId: string;
  sku: string;
  stockQuantity: number;
  /** Weighted average purchase cost at this branch (from variant.averageCost). */
  averageCost?: number;
  images: string[];
  attributes?: Array<{
    attributeName: string;
    attributeValue: string;
  }>;
  price?: {
    sellingPrice: number;
    discountType?: 'fixed' | 'percentage';
    discountValue?: number;
  };
  /** Full IMEI rows when small; otherwise empty — picker fetches on demand. */
  serialNumbers?: Array<string | { serialNumber?: string; status?: string }>;
  /** Count of available serials for stock filtering without keeping huge arrays. */
  availableSerialCount?: number;
}

export interface CartItem {
  id: string; // Unique cart item ID
  productId: string;
  variantId: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  /** Avg purchase cost per unit when added to cart (variant averageCost). */
  purchaseUnitPrice?: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  lineTotal: number;
  stockAvailable: number;
  image?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  batchNumbers?: string[]; // Multiple batch numbers if different batches are selected
  serialBatchMap?: Record<string, string>; // Map serial number to batch number for batch-wise display
}

export interface POSCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  image?: string;
  branch?: {
    id: string;
    name: string;
  };
  totalOrders?: number;
  totalSpent?: number;
  advanceBalance?: number;
  rewardPoints?: number;
  vipStatus?: {
    isVIP: boolean;
    discountPercent?: number;
  };
}

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discount: number;
  discountAmount: number; // Calculated discount amount
  minimumOrderAmount?: number;
  maximumDiscount?: number;
}

export interface AppliedGiftCard {
  id: string;
  code: string;
  balance: number;
  appliedAmount: number; // Amount applied to this order
  remainingBalance: number; // Balance after application
}

export interface AppliedService {
  id: string;
  name: string;
  price: number;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'mobile_banking' | 'bank_transfer';
  amount: number;
  transactionId?: string;
  /** Shown on invoice print (e.g. "Main cash", "bKash shop"); falls back to payment type label. */
  accountName?: string;
  /** Ledger accountType e.g. Cash, Mobile Banking — invoice uses for “Cash by hand” when name missing. */
  accountType?: string;
}

export interface OrderSummary {
  subtotal: number;
  orderDiscountAmount: number;
  couponDiscount: number;
  giftCardDiscount: number;
  vipDiscount: number;
  pointsDiscount: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  totalPaid: number;
  dueAmount: number;
  changeAmount: number;
  redeemPoints: number;
}

export interface POSState {
  selectedCategoryId: string | null;
  products: POSProduct[];
  filteredProducts: POSProduct[];
  cart: CartItem[];
  selectedCustomer: POSCustomer | null;
  isWalkingCustomer: boolean;
  appliedCoupon: AppliedCoupon | null;
  appliedGiftCard: AppliedGiftCard | null;
  appliedServices: AppliedService[];
  payments: PaymentMethod[];
  orderSummary: OrderSummary;
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

