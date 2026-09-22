import { Router, Request, Response } from 'express';
import { db, sqliteDb } from '../db/index.ts';
import { products, branchStock } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

export const productsRouter = Router();

function generateArgentineEAN13(): string {
  const prefix = '779'; // Argentina country code
  let body = '';
  for (let i = 0; i < 9; i++) {
    body += Math.floor(Math.random() * 10).toString();
  }
  const digits = (prefix + body).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += i % 2 === 0 ? digits[i] : digits[i] * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix}${body}${checkDigit}`;
}

function formatProduct(p: typeof products.$inferSelect, stocks: { branchId: string; quantity: number }[]) {
  const stockByStore: Record<string, number> = {
    belgrano: 0,
    colegiales: 0,
    central: 0,
  };

  for (const s of stocks) {
    stockByStore[s.branchId] = s.quantity;
  }

  let specs = {};
  try {
    specs = JSON.parse(p.specsJson || '{}');
  } catch {}

  let tags = [];
  try {
    tags = JSON.parse(p.tagsJson || '[]');
  } catch {}

  return {
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
    specs,
    featured: Boolean(p.featured),
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    tags,
    stockByStore,
    createdAt: p.createdAt,
  };
}

// GET /api/products - Get all products with branch stock
productsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allProducts = db.select().from(products).all();
    const allStocks = db.select().from(branchStock).all();

    // Group stocks by productId
    const stockMap = new Map<string, { branchId: string; quantity: number }[]>();
    for (const s of allStocks) {
      if (!stockMap.has(s.productId)) {
        stockMap.set(s.productId, []);
      }
      stockMap.get(s.productId)!.push({ branchId: s.branchId, quantity: s.quantity });
    }

    const formatted = allProducts.map((p) =>
      formatProduct(p, stockMap.get(p.id) || [])
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

// GET /api/products/:id - Get single product
productsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const p = db.select().from(products).where(eq(products.id, req.params.id)).get();
    if (!p) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const stocks = db.select().from(branchStock).where(eq(branchStock.productId, p.id)).all();
    res.json(formatProduct(p, stocks));
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error al obtener producto.' });
  }
});

// POST /api/products - Create a new product (Admin only)
productsRouter.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      costPrice,
      marginPercent,
      image,
      barcode,
      specs,
      tags,
      stockByStore,
    } = req.body;

    if (!name || !brand || !category || price === undefined) {
      res.status(400).json({ error: 'Nombre, marca, categoría y precio son obligatorios.' });
      return;
    }

    const numPrice = Number(price);
    const numCost = Number(costPrice) || Math.round(numPrice * 0.7);
    const calcMargin = Number(marginPercent) || Math.round(((numPrice - numCost) / numPrice) * 100);

    const productId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalBarcode = barcode?.trim() || generateArgentineEAN13();
    const finalImage = image?.trim() || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80';
    const createdAt = new Date().toISOString();

    sqliteDb.transaction(() => {
      // 1. Insert product record
      db.insert(products)
        .values({
          id: productId,
          name: name.trim(),
          brand: brand.trim(),
          category: category.trim(),
          description: description?.trim() || `${brand} ${name}`,
          price: numPrice,
          costPrice: numCost,
          marginPercent: calcMargin,
          image: finalImage,
          barcode: finalBarcode,
          specsJson: JSON.stringify(specs || {}),
          tagsJson: JSON.stringify(tags || []),
          featured: false,
          rating: 5.0,
          reviewsCount: 0,
          createdAt,
        })
        .run();

      // 2. Initialize stock per store
      const initialStocks = {
        belgrano: Number(stockByStore?.belgrano) || 0,
        colegiales: Number(stockByStore?.colegiales) || 0,
        central: Number(stockByStore?.central) || 0,
      };

      for (const [branchId, quantity] of Object.entries(initialStocks)) {
        db.insert(branchStock)
          .values({
            branchId,
            productId,
            quantity,
          })
          .run();
      }
    })();

    const createdProd = db.select().from(products).where(eq(products.id, productId)).get()!;
    const createdStocks = db.select().from(branchStock).where(eq(branchStock.productId, productId)).all();

    res.status(201).json(formatProduct(createdProd, createdStocks));
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Error al crear producto en la base de datos.' });
  }
});

// PUT /api/products/:id - Update product (Admin only)
productsRouter.put('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = db.select().from(products).where(eq(products.id, id)).get();
    if (!existing) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    const {
      name,
      brand,
      category,
      description,
      price,
      costPrice,
      marginPercent,
      image,
      barcode,
      specs,
      tags,
      stockByStore,
    } = req.body;

    const numPrice = price !== undefined ? Number(price) : existing.price;
    const numCost = costPrice !== undefined ? Number(costPrice) : existing.costPrice;
    const calcMargin = marginPercent !== undefined ? Number(marginPercent) : existing.marginPercent;

    sqliteDb.transaction(() => {
      // 1. Update product table
      db.update(products)
        .set({
          name: name !== undefined ? name.trim() : existing.name,
          brand: brand !== undefined ? brand.trim() : existing.brand,
          category: category !== undefined ? category.trim() : existing.category,
          description: description !== undefined ? description.trim() : existing.description,
          price: numPrice,
          costPrice: numCost,
          marginPercent: calcMargin,
          image: image !== undefined ? image.trim() : existing.image,
          barcode: barcode !== undefined ? barcode.trim() : existing.barcode,
          specsJson: specs !== undefined ? JSON.stringify(specs) : existing.specsJson,
          tagsJson: tags !== undefined ? JSON.stringify(tags) : existing.tagsJson,
        })
        .where(eq(products.id, id))
        .run();

      // 2. Update stock if passed
      if (stockByStore) {
        for (const [branchId, quantity] of Object.entries(stockByStore)) {
          const current = db
            .select()
            .from(branchStock)
            .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, id)))
            .get();

          if (current) {
            db.update(branchStock)
              .set({ quantity: Number(quantity) })
              .where(eq(branchStock.id, current.id))
              .run();
          } else {
            db.insert(branchStock)
              .values({
                branchId,
                productId: id,
                quantity: Number(quantity),
              })
              .run();
          }
        }
      }
    })();

    const updatedProd = db.select().from(products).where(eq(products.id, id)).get()!;
    const updatedStocks = db.select().from(branchStock).where(eq(branchStock.productId, id)).all();

    res.json(formatProduct(updatedProd, updatedStocks));
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar producto.' });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
productsRouter.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = db.select().from(products).where(eq(products.id, id)).get();
    if (!existing) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }

    sqliteDb.transaction(() => {
      db.delete(branchStock).where(eq(branchStock.productId, id)).run();
      db.delete(products).where(eq(products.id, id)).run();
    })();

    res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar producto.' });
  }
});
