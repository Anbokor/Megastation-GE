import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'seller', 'customer'] }).notNull().default('customer'),
  branchId: text('branch_id'),
  phone: text('phone'),
  dni: text('dni'),
  createdAt: text('created_at').notNull(),
});

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  address: text('address').notNull(),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  hours: text('hours').notNull(),
  isPickupAvailable: integer('is_pickup_available', { mode: 'boolean' }).notNull().default(true),
  type: text('type', { enum: ['store', 'warehouse'] }).notNull().default('store'),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  costPrice: integer('cost_price').notNull(),
  marginPercent: integer('margin_percent').notNull().default(35),
  image: text('image').notNull(),
  barcode: text('barcode').notNull().unique(),
  specsJson: text('specs_json').notNull().default('{}'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  rating: real('rating').notNull().default(5.0),
  reviewsCount: integer('reviews_count').notNull().default(0),
  tagsJson: text('tags_json').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
});

export const branchStock = sqliteTable('branch_stock', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  branchId: text('branch_id').notNull(),
  productId: text('product_id').notNull(),
  quantity: integer('quantity').notNull().default(0),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  trackingNumber: text('tracking_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerDni: text('customer_dni').notNull(),
  customerAddressJson: text('customer_address_json'),
  deliveryMethod: text('delivery_method', { enum: ['pickup', 'delivery'] }).notNull(),
  branchId: text('branch_id'),
  paymentMethod: text('payment_method', { enum: ['mercadopago', 'credit_card', 'bank_transfer', 'cash_pickup'] }).notNull(),
  paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'rejected'] }).notNull().default('pending'),
  orderStatus: text('order_status', { enum: ['pendiente', 'en_preparacion', 'listo_retiro', 'en_camino', 'entregado', 'cancelado'] }).notNull().default('pendiente'),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shippingCost: integer('shipping_cost').notNull().default(0),
  total: integer('total').notNull(),
  statusHistoryJson: text('status_history_json').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  brand: text('brand').notNull(),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull(),
  barcode: text('barcode').notNull(),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['inbound', 'transfer', 'order_deduction', 'adjustment'] }).notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  fromBranch: text('from_branch'),
  toBranch: text('to_branch'),
  quantity: integer('quantity').notNull(),
  costPrice: integer('cost_price'),
  finalPrice: integer('final_price'),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});
