import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, sqliteDb } from '../db/index.ts';
import { orders, orderItems, products, branchStock, inventoryTransactions } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateToken, requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

export const ordersRouter = Router();

// Helper to format order output with items
function formatOrderResponse(
  order: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[]
) {
  let address = undefined;
  if (order.customerAddressJson) {
    try {
      address = JSON.parse(order.customerAddressJson);
    } catch {}
  }

  let statusHistory = [];
  try {
    statusHistory = JSON.parse(order.statusHistoryJson || '[]');
  } catch {}

  return {
    id: order.id,
    trackingNumber: order.trackingNumber,
    customer: {
      fullName: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      dni: order.customerDni,
      address,
    },
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      brand: i.brand,
      price: i.price,
      quantity: i.quantity,
      barcode: i.barcode,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shippingCost,
    total: order.total,
    deliveryMethod: order.deliveryMethod,
    branchId: order.branchId || undefined,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    statusHistory,
    createdAt: order.createdAt,
  };
}

// POST /api/orders (Create order with server-side price validation & atomic stock decrement)
ordersRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      customer,
      items,
      deliveryMethod,
      branchId,
      paymentMethod,
    } = req.body;

    if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.dni) {
      res.status(400).json({ error: 'Datos del cliente incompletos.' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'El carrito de compras está vacío.' });
      return;
    }

    if (!['pickup', 'delivery'].includes(deliveryMethod)) {
      res.status(400).json({ error: 'Método de entrega inválido.' });
      return;
    }

    const targetBranch = deliveryMethod === 'pickup' && branchId ? branchId : 'central';

    // SERVER-SIDE PRICE AND STOCK VALIDATION
    const validatedItems: {
      productId: string;
      productName: string;
      brand: string;
      price: number;
      quantity: number;
      barcode: string;
    }[] = [];

    let calculatedSubtotal = 0;

    for (const item of items) {
      const dbProd = db.select().from(products).where(eq(products.id, item.productId)).get();
      if (!dbProd) {
        res.status(400).json({ error: `El producto ${item.productId} no existe en el catálogo.` });
        return;
      }

      const qty = Math.max(1, Number(item.quantity) || 1);

      // Verify stock in target branch
      const stockRecord = db
        .select()
        .from(branchStock)
        .where(and(eq(branchStock.branchId, targetBranch), eq(branchStock.productId, dbProd.id)))
        .get();

      const availableStock = stockRecord?.quantity || 0;
      if (availableStock < qty) {
        res.status(400).json({
          error: `Stock insuficiente para "${dbProd.name}" en sucursal ${targetBranch.toUpperCase()} (disponibles: ${availableStock}, solicitados: ${qty}).`,
        });
        return;
      }

      const lineTotal = dbProd.price * qty;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: dbProd.id,
        productName: dbProd.name,
        brand: dbProd.brand,
        price: dbProd.price, // Always use server DB price
        quantity: qty,
        barcode: dbProd.barcode,
      });
    }

    // Financial calculations
    const isTransfer = paymentMethod === 'bank_transfer';
    const calculatedDiscount = isTransfer ? Math.round(calculatedSubtotal * 0.1) : 0;
    const shippingCost = deliveryMethod === 'delivery' ? 4500 : 0;
    const calculatedTotal = calculatedSubtotal - calculatedDiscount + shippingCost;

    // Generate unique IDs
    const orderId = `MGST-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
    const trackingNumber = `ARG-MGST-${Date.now().toString().slice(-4)}-${crypto.randomInt(1000, 9999)}`;

    // Initial status history
    const initialStatusHistory = [
      {
        status: 'pendiente',
        timestamp: new Date().toISOString(),
        note:
          paymentMethod === 'mercadopago'
            ? 'Orden generada para pago con Mercado Pago Sandbox.'
            : paymentMethod === 'bank_transfer'
            ? 'Esperando acreditación de transferencia bancaria.'
            : 'Orden confirmada para abonar al retirar en mostrador.',
      },
    ];

    // ATOMIC TRANSACTION: Insert order, items and decrement stock
    sqliteDb.transaction(() => {
      // 1. Insert order
      db.insert(orders)
        .values({
          id: orderId,
          trackingNumber,
          customerName: customer.fullName.trim(),
          customerEmail: customer.email.trim().toLowerCase(),
          customerPhone: customer.phone.trim(),
          customerDni: customer.dni.trim(),
          customerAddressJson: customer.address ? JSON.stringify(customer.address) : null,
          deliveryMethod,
          branchId: deliveryMethod === 'pickup' ? branchId : null,
          paymentMethod,
          paymentStatus: paymentMethod === 'cash_pickup' ? 'pending' : 'pending',
          orderStatus: 'pendiente',
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          shippingCost,
          total: calculatedTotal,
          statusHistoryJson: JSON.stringify(initialStatusHistory),
          createdAt: new Date().toISOString(),
        })
        .run();

      // 2. Insert items & decrement stock
      for (const item of validatedItems) {
        db.insert(orderItems)
          .values({
            orderId,
            productId: item.productId,
            productName: item.productName,
            brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode,
          })
          .run();

        // Decrement stock
        const currentStock = db
          .select()
          .from(branchStock)
          .where(and(eq(branchStock.branchId, targetBranch), eq(branchStock.productId, item.productId)))
          .get()!;

        db.update(branchStock)
          .set({ quantity: Math.max(0, currentStock.quantity - item.quantity) })
          .where(eq(branchStock.id, currentStock.id))
          .run();

        // Log inventory transaction
        db.insert(inventoryTransactions)
          .values({
            id: `tx-order-${orderId}-${item.productId}`,
            type: 'order_deduction',
            productId: item.productId,
            productName: item.productName,
            fromBranch: targetBranch,
            quantity: item.quantity,
            note: `Descuento automático por orden de compra ${orderId}`,
            createdAt: new Date().toISOString(),
          })
          .run();
      }
    })();

    const createdOrder = db.select().from(orders).where(eq(orders.id, orderId)).get()!;
    const createdItems = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();

    res.status(201).json(formatOrderResponse(createdOrder, createdItems));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error al procesar la orden de compra.' });
  }
});

// GET /api/orders (List orders with role-based filtering)
ordersRouter.get('/', authenticateToken, requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let orderList: (typeof orders.$inferSelect)[] = [];

    if (user.role === 'admin') {
      orderList = db.select().from(orders).orderBy(desc(orders.createdAt)).all();
    } else if (user.role === 'seller') {
      if (user.branchId) {
        orderList = db
          .select()
          .from(orders)
          .where(eq(orders.branchId, user.branchId))
          .orderBy(desc(orders.createdAt))
          .all();
      } else {
        orderList = db.select().from(orders).orderBy(desc(orders.createdAt)).all();
      }
    } else {
      orderList = db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, user.email.toLowerCase()))
        .orderBy(desc(orders.createdAt))
        .all();
    }

    const allOrderItems = db.select().from(orderItems).all();
    const itemsMap = new Map<string, (typeof orderItems.$inferSelect)[]>();
    for (const item of allOrderItems) {
      if (!itemsMap.has(item.orderId)) {
        itemsMap.set(item.orderId, []);
      }
      itemsMap.get(item.orderId)!.push(item);
    }

    const formatted = orderList.map((o) =>
      formatOrderResponse(o, itemsMap.get(o.id) || [])
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error al obtener órdenes.' });
  }
});

// GET /api/orders/track (Public secure tracking by orderId or trackingNumber)
ordersRouter.get('/track', async (req, res): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Código de seguimiento requerido.' });
      return;
    }

    const cleanCode = code.trim().toLowerCase();
    const allOrders = db.select().from(orders).all();
    const found = allOrders.find(
      (o) =>
        o.id.toLowerCase() === cleanCode ||
        o.trackingNumber.toLowerCase() === cleanCode
    );

    if (!found) {
      res.status(404).json({ error: 'No se encontró ninguna orden con el código ingresado.' });
      return;
    }

    const items = db.select().from(orderItems).where(eq(orderItems.orderId, found.id)).all();
    res.json(formatOrderResponse(found, items));
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Error al rastrear la orden.' });
  }
});

// PATCH /api/orders/:id/status (Update order status, requires seller or admin)
ordersRouter.patch('/:id/status', authenticateToken, requireAuth, requireRole('admin', 'seller'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Nuevo estado requerido.' });
      return;
    }

    const existing = db.select().from(orders).where(eq(orders.id, id)).get();
    if (!existing) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }

    let history: any[] = [];
    try {
      history = JSON.parse(existing.statusHistoryJson || '[]');
    } catch {}

    history.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Estado actualizado a ${status.toUpperCase()} por ${req.user?.name}`,
    });

    db.update(orders)
      .set({
        orderStatus: status,
        statusHistoryJson: JSON.stringify(history),
      })
      .where(eq(orders.id, id))
      .run();

    res.json({ success: true, orderStatus: status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});
