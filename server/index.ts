import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/index.ts';
import { seed } from './db/seed.ts';
import { authenticateToken } from './middleware/auth.ts';
import { authRouter } from './routes/auth.ts';
import { branchesRouter } from './routes/branches.ts';
import { productsRouter } from './routes/products.ts';
import { inventoryRouter } from './routes/inventory.ts';
import { ordersRouter } from './routes/orders.ts';
import { paymentsRouter } from './routes/payments.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database and run seeds if empty
initDatabase();
seed().catch((err) => console.error('Database seed check error:', err));

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(authenticateToken);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Megastation API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Production Static File Serving (SPA)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Error interno en el servidor API.' });
});

export const startServer = (port: number | string = PORT) => {
  return app.listen(port, () => {
    console.log(`🚀 Megastation API Server running at http://localhost:${port}`);
  });
};

if (!process.env.NO_AUTO_START) {
  startServer();
}

export default app;
