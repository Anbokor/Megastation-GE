import { Product, StoreBranch, Order, InboundInvoiceItem, AppUser, StoreBranchId } from '../types';

const TOKEN_KEY = 'mgst_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// --- Auth API ---
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AppUser }> {
  const res = await apiFetch<{ token: string; user: AppUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.token);
  return res;
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dni?: string;
  branchId?: string;
}): Promise<{ token: string; user: AppUser }> {
  const res = await apiFetch<{ token: string; user: AppUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setAuthToken(res.token);
  return res;
}

export async function apiGetMe(): Promise<AppUser | null> {
  try {
    const res = await apiFetch<{ user: AppUser }>('/api/auth/me');
    return res.user;
  } catch {
    setAuthToken(null);
    return null;
  }
}

// --- Products & Branches API ---
export async function apiGetProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/api/products');
}

export async function apiGetBranches(): Promise<StoreBranch[]> {
  return apiFetch<StoreBranch[]>('/api/branches');
}

// --- Orders API ---
export async function apiCreateOrder(orderData: {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    dni: string;
    address?: any;
  };
  items: { productId: string; quantity: number }[];
  deliveryMethod: 'pickup' | 'delivery';
  branchId?: StoreBranchId;
  paymentMethod: string;
}): Promise<Order> {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function apiGetOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/api/orders');
}

export async function apiTrackOrder(code: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/track?code=${encodeURIComponent(code)}`);
}

export async function apiUpdateOrderStatus(orderId: string, status: string, note?: string): Promise<void> {
  await apiFetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

// --- Inventory API ---
export async function apiInboundStock(item: InboundInvoiceItem): Promise<void> {
  await apiFetch('/api/inventory/inbound', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function apiTransferStock(
  productId: string,
  fromBranch: StoreBranchId,
  toBranch: StoreBranchId,
  quantity: number
): Promise<void> {
  await apiFetch('/api/inventory/transfer', {
    method: 'POST',
    body: JSON.stringify({ productId, fromBranch, toBranch, quantity }),
  });
}

export async function apiAdjustStock(
  productId: string,
  branchId: StoreBranchId,
  quantity: number
): Promise<void> {
  await apiFetch('/api/inventory/stock', {
    method: 'PATCH',
    body: JSON.stringify({ productId, branchId, quantity }),
  });
}

// --- Payments API ---
export async function apiCreatePaymentPreference(orderId: string): Promise<{
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
  mode: string;
}> {
  return apiFetch('/api/payments/create-preference', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

// --- Product CRUD API ---
export async function apiCreateProduct(productData: {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  costPrice?: number;
  marginPercent?: number;
  image?: string;
  barcode?: string;
  specs?: Record<string, string>;
  tags?: string[];
  stockByStore?: { belgrano?: number; colegiales?: number; central?: number };
}): Promise<Product> {
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

export async function apiUpdateProduct(
  id: string,
  productData: Partial<{
    name: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    costPrice: number;
    marginPercent: number;
    image: string;
    barcode: string;
    specs: Record<string, string>;
    tags: string[];
    stockByStore: { belgrano?: number; colegiales?: number; central?: number };
  }>
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
}

export async function apiDeleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

export interface InventoryTransaction {
  id: string;
  type: 'inbound' | 'transfer' | 'order_deduction' | 'adjustment';
  productId: string;
  productName: string;
  fromBranch?: string | null;
  toBranch?: string | null;
  quantity: number;
  costPrice?: number | null;
  finalPrice?: number | null;
  note?: string | null;
  createdAt: string;
}

export async function apiGetInventoryTransactions(): Promise<InventoryTransaction[]> {
  return apiFetch<InventoryTransaction[]>('/api/inventory/transactions');
}

