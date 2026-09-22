import { Router } from 'express';
import { db } from '../db/index.ts';
import { products, branchStock } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const productsRouter = Router();

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

// GET /api/products
productsRouter.get('/', async (_req, res): Promise<void> => {
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

// GET /api/products/:id
productsRouter.get('/:id', async (req, res): Promise<void> => {
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
