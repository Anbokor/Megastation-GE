import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { JWT_SECRET, AuthenticatedRequest, requireAuth, AuthUser } from '../middleware/auth.ts';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.select().from(users).where(eq(users.email, cleanEmail)).get();

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas. Verifique su email y contraseña.' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(String(password), user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
      return;
    }

    const authPayload: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'seller' | 'customer',
      branchId: user.branchId,
      phone: user.phone,
      dni: user.dni,
    };

    const token = jwt.sign(authPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: authPayload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor durante el inicio de sesión.' });
  }
});

// POST /api/auth/register
authRouter.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, phone, dni, branchId } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = db.select().from(users).where(eq(users.email, cleanEmail)).get();
    if (existing) {
      res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
      return;
    }

    const newId = `usr-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(String(password), 10);

    const newUser = {
      id: newId,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: 'customer' as const,
      branchId: branchId || 'belgrano',
      phone: phone ? String(phone).trim() : null,
      dni: dni ? String(dni).trim() : null,
      createdAt: new Date().toISOString(),
    };

    db.insert(users).values(newUser).run();

    const authPayload: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      branchId: newUser.branchId,
      phone: newUser.phone,
      dni: newUser.dni,
    };

    const token = jwt.sign(authPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: authPayload,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
});
