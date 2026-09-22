import { Router } from 'express';
import { db } from '../db/index.ts';
import { branches } from '../db/schema.ts';

export const branchesRouter = Router();

// GET /api/branches
branchesRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const allBranches = db.select().from(branches).all();
    res.json(allBranches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Error al obtener sucursales.' });
  }
});
