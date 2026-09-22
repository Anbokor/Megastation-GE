import { Router } from 'express';
import { db, sqliteDb } from '../db/index.ts';
import { products, branchStock, inventoryTransactions } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

export const inventoryRouter = Router();

// Require admin or seller for all inventory operations
inventoryRouter.use(requireAuth);
inventoryRouter.use(requireRole('admin', 'seller'));

// POST /api/inventory/inbound (Ingreso de mercadería / Remito)
inventoryRouter.post('/inbound', async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const {
      productId,
      quantity,
      costPrice,
      desiredMarginPercent,
      finalPrice,
      targetBranch,
    } = req.body;

    if (!productId || !quantity || !targetBranch) {
      res.status(400).json({ error: 'Faltan campos obligatorios para el ingreso de mercadería.' });
      return;
    }

    const prod = db.select().from(products).where(eq(products.id, productId)).get();
    if (!prod) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const qtyNumber = Number(quantity);
    const finalPriceNumber = Number(finalPrice) || prod.price;
    const costPriceNumber = Number(costPrice) || prod.costPrice;

    // Run in atomic transaction
    sqliteDb.transaction(() => {
      // 1. Update product price and cost
      db.update(products)
        .set({
          price: finalPriceNumber,
          costPrice: costPriceNumber,
          marginPercent: Number(desiredMarginPercent) || prod.marginPercent,
        })
        .where(eq(products.id, productId))
        .run();

      // 2. Increment stock in target branch
      const currentStock = db
        .select()
        .from(branchStock)
        .where(and(eq(branchStock.branchId, targetBranch), eq(branchStock.productId, productId)))
        .get();

      if (currentStock) {
        db.update(branchStock)
          .set({ quantity: currentStock.quantity + qtyNumber })
          .where(eq(branchStock.id, currentStock.id))
          .run();
      } else {
        db.insert(branchStock)
          .values({
            branchId: targetBranch,
            productId,
            quantity: qtyNumber,
          })
          .run();
      }

      // 3. Log transaction
      db.insert(inventoryTransactions)
        .values({
          id: `tx-inbound-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'inbound',
          productId,
          productName: prod.name,
          toBranch: targetBranch,
          quantity: qtyNumber,
          costPrice: costPriceNumber,
          finalPrice: finalPriceNumber,
          note: `Ingreso de mercadería por remito / factura a sucursal ${targetBranch.toUpperCase()}`,
          createdAt: new Date().toISOString(),
        })
        .run();
    })();

    res.json({ success: true, message: 'Stock y precios actualizados exitosamente.' });
  } catch (error) {
    console.error('Error in inbound stock:', error);
    res.status(500).json({ error: 'Error al procesar ingreso de mercadería.' });
  }
});

// POST /api/inventory/transfer (Transferencia entre sucursales)
inventoryRouter.post('/transfer', async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { productId, fromBranch, toBranch, quantity } = req.body;
    if (!productId || !fromBranch || !toBranch || !quantity) {
      res.status(400).json({ error: 'Datos incompletos para la transferencia.' });
      return;
    }

    if (fromBranch === toBranch) {
      res.status(400).json({ error: 'La sucursal de origen y destino deben ser distintas.' });
      return;
    }

    const prod = db.select().from(products).where(eq(products.id, productId)).get();
    if (!prod) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const qty = Math.max(1, Number(quantity));

    sqliteDb.transaction(() => {
      // 1. Check fromBranch stock
      const sourceStock = db
        .select()
        .from(branchStock)
        .where(and(eq(branchStock.branchId, fromBranch), eq(branchStock.productId, productId)))
        .get();

      if (!sourceStock || sourceStock.quantity < qty) {
        throw new Error(`Stock insuficiente en sucursal de origen (${fromBranch}).`);
      }

      // 2. Decrement source
      db.update(branchStock)
        .set({ quantity: sourceStock.quantity - qty })
        .where(eq(branchStock.id, sourceStock.id))
        .run();

      // 3. Increment destination
      const destStock = db
        .select()
        .from(branchStock)
        .where(and(eq(branchStock.branchId, toBranch), eq(branchStock.productId, productId)))
        .get();

      if (destStock) {
        db.update(branchStock)
          .set({ quantity: destStock.quantity + qty })
          .where(eq(branchStock.id, destStock.id))
          .run();
      } else {
        db.insert(branchStock)
          .values({
            branchId: toBranch,
            productId,
            quantity: qty,
          })
          .run();
      }

      // 4. Log transaction
      db.insert(inventoryTransactions)
        .values({
          id: `tx-transfer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'transfer',
          productId,
          productName: prod.name,
          fromBranch,
          toBranch,
          quantity: qty,
          note: `Transferencia de ${fromBranch.toUpperCase()} a ${toBranch.toUpperCase()}`,
          createdAt: new Date().toISOString(),
        })
        .run();
    })();

    res.json({ success: true, message: 'Transferencia realizada con éxito.' });
  } catch (error: any) {
    console.error('Error in stock transfer:', error);
    res.status(400).json({ error: error.message || 'Error al realizar transferencia.' });
  }
});

// PATCH /api/inventory/stock (Ajuste directo de stock)
inventoryRouter.patch('/stock', async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { productId, branchId, quantity } = req.body;
    if (!productId || !branchId || quantity === undefined) {
      res.status(400).json({ error: 'Faltan parámetros de ajuste.' });
      return;
    }

    const newQty = Math.max(0, Number(quantity));

    const existing = db
      .select()
      .from(branchStock)
      .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, productId)))
      .get();

    if (existing) {
      db.update(branchStock)
        .set({ quantity: newQty })
        .where(eq(branchStock.id, existing.id))
        .run();
    } else {
      db.insert(branchStock)
        .values({
          branchId,
          productId,
          quantity: newQty,
        })
        .run();
    }

    res.json({ success: true, quantity: newQty });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Error al ajustar stock.' });
  }
});
