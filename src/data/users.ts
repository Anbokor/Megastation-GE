import { AppUser } from '../types';

export const DEMO_USERS: AppUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Roberto Méndez',
    email: 'admin@megastation.com',
    role: 'admin',
    branchId: 'central',
    phone: '+54 11 4781-9000',
    dni: '29.340.112',
  },
  {
    id: 'usr-seller-belgrano',
    name: 'Lucas Ferreyra',
    email: 'belgrano@megastation.com',
    role: 'seller',
    branchId: 'belgrano',
    phone: '+54 11 4781-9001',
    dni: '35.882.104',
  },
  {
    id: 'usr-seller-colegiales',
    name: 'Sofía Romero',
    email: 'colegiales@megastation.com',
    role: 'seller',
    branchId: 'colegiales',
    phone: '+54 11 4552-3400',
    dni: '37.194.551',
  },
  {
    id: 'usr-customer-1',
    name: 'Martín Gómez',
    email: 'martin.gomez@gmail.com',
    role: 'customer',
    branchId: 'belgrano',
    phone: '+54 9 11 5543-9821',
    dni: '38.412.980',
  },
];

const AUTH_STORAGE_KEY = 'mgst_auth_user';

export const getStoredAuthUser = (): AppUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredAuthUser = (user: AppUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not store auth session', e);
  }
};

export const clearStoredAuthUser = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear auth session', e);
  }
};
