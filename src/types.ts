// TypeScript definitions for Megastation Shop

export type StoreBranchId = 'belgrano' | 'colegiales' | 'central';

export interface StoreBranch {
  id: StoreBranchId;
  name: string;
  shortName: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  whatsapp: string;
  hours: string;
  isPickupAvailable: boolean;
  type: 'store' | 'warehouse';
}

export type ProductCategory = 
  | 'celulares' 
  | 'fundas' 
  | 'cargadores' 
  | 'audio' 
  | 'wearables' 
  | 'servicio_tecnico';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  iconName: string;
  description: string;
  defaultMarginPercent: number; // For invoice markup calculation
}

export interface ProductSpecs {
  screen?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  battery?: string;
  camera?: string;
  compatibility?: string;
  connectivity?: string;
  color?: string;
  warrantyMonths: number;
}

export interface Product {
  id: string;
  name: string;
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'Motorola' | 'Anker' | 'JBL' | 'Generic';
  category: ProductCategory;
  description: string;
  price: number; // Selling price in ARS ($)
  costPrice: number; // Purchase/Inbound cost in ARS ($)
  marginPercent: number; // Desired or actual margin %
  image: string;
  barcode: string; // EAN-13 code
  stockByStore: Record<StoreBranchId, number>;
  specs: ProductSpecs;
  featured?: boolean;
  rating: number;
  reviewsCount: number;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  preferredBranchId?: StoreBranchId;
  isBackorder?: boolean;
}

export type DeliveryMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'mercadopago' | 'credit_card' | 'bank_transfer' | 'cash_pickup';

export type OrderStatus = 
  | 'pendiente' 
  | 'en_preparacion' 
  | 'listo_retiro' 
  | 'en_camino' 
  | 'entregado' 
  | 'cancelado';

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  dni: string; // Argentine national ID / CUIT
  address?: {
    street: string;
    number: string;
    floorApt?: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  barcode: string;
  isBackorder?: boolean;
}

export interface Order {
  id: string; // e.g., MGST-2026-0842
  trackingNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  branchId?: StoreBranchId;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  orderStatus: OrderStatus;
  hasBackorder?: boolean;
  createdAt: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

export type AppUserRole = 'customer' | 'seller' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  branchId?: StoreBranchId;
  phone?: string;
  dni?: string;
}

export interface InboundInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  barcode: string;
  quantity: number;
  costPrice: number;
  desiredMarginPercent: number;
  suggestedPrice: number;
  finalPrice: number;
  targetBranch: StoreBranchId;
}

export interface InboundInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  items: InboundInvoiceItem[];
  totalCost: number;
  totalProjectedRevenue: number;
  notes?: string;
}
