import bcrypt from 'bcryptjs';
import { db, initDatabase } from './index.ts';
import { branches, products, branchStock, users, orders, orderItems } from './schema.ts';
import { INITIAL_BRANCHES, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../../src/data/initialData.ts';
import { DEMO_USERS } from '../../src/data/users.ts';

export async function seed() {
  console.log('🌱 Initializing SQLite database and running seeds...');
  initDatabase();

  // 1. Seed branches
  const existingBranches = db.select().from(branches).all();
  if (existingBranches.length === 0) {
    console.log('📍 Seeding branches...');
    for (const b of INITIAL_BRANCHES) {
      db.insert(branches).values({
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        address: b.address,
        neighborhood: b.neighborhood,
        city: b.city,
        phone: b.phone,
        whatsapp: b.whatsapp,
        hours: b.hours,
        isPickupAvailable: b.isPickupAvailable,
        type: b.type,
      }).run();
    }
  }

  // 2. Seed products & stock
  const existingProducts = db.select().from(products).all();
  if (existingProducts.length === 0) {
    console.log('📦 Seeding products & branch stocks...');
    for (const p of INITIAL_PRODUCTS) {
      db.insert(products).values({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
        price: p.price,
        costPrice: p.costPrice,
        marginPercent: p.marginPercent,
        image: p.image,
        barcode: p.barcode,
        specsJson: JSON.stringify(p.specs || {}),
        featured: Boolean(p.featured),
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        tagsJson: JSON.stringify(p.tags || []),
        createdAt: new Date().toISOString(),
      }).run();

      // Seed stocks for each store
      for (const [branchId, qty] of Object.entries(p.stockByStore)) {
        db.insert(branchStock).values({
          branchId,
          productId: p.id,
          quantity: qty,
        }).run();
      }
    }
  }

  // 3. Seed users with secure bcrypt hashes
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length === 0) {
    console.log('👤 Seeding users with hashed passwords...');
    const defaultPasswords: Record<string, string> = {
      'admin@megastation.com': 'admin123',
      'belgrano@megastation.com': 'belgrano123',
      'colegiales@megastation.com': 'colegiales123',
      'martin.gomez@gmail.com': 'customer123',
    };

    for (const u of DEMO_USERS) {
      const plainPassword = defaultPasswords[u.email.toLowerCase()] || 'password123';
      const passwordHash = bcrypt.hashSync(plainPassword, 10);

      db.insert(users).values({
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase(),
        passwordHash,
        role: u.role,
        branchId: u.branchId,
        phone: u.phone,
        dni: u.dni,
        createdAt: new Date().toISOString(),
      }).run();
    }
  }

  // 4. Seed orders
  const existingOrders = db.select().from(orders).all();
  if (existingOrders.length === 0) {
    console.log('📋 Seeding initial demo orders...');
    for (const o of INITIAL_ORDERS) {
      db.insert(orders).values({
        id: o.id,
        trackingNumber: o.trackingNumber,
        customerName: o.customer.fullName,
        customerEmail: o.customer.email,
        customerPhone: o.customer.phone,
        customerDni: o.customer.dni,
        customerAddressJson: o.customer.address ? JSON.stringify(o.customer.address) : null,
        deliveryMethod: o.deliveryMethod,
        branchId: o.branchId || null,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        subtotal: o.subtotal,
        discount: o.discount,
        shippingCost: o.shippingCost,
        total: o.total,
        statusHistoryJson: JSON.stringify(o.statusHistory || []),
        createdAt: o.createdAt,
      }).run();

      for (const item of o.items) {
        db.insert(orderItems).values({
          orderId: o.id,
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          barcode: item.barcode,
        }).run();
      }
    }
  }

  console.log('✅ Database successfully seeded!');
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
