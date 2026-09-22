import { Product, StoreBranchId } from '../types';

/**
 * Format number into Argentine Pesos ($ ARS) currency format
 */
export function formatCurrencyARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate installment payments (cuotas sin interés)
 */
export function calculateInstallments(price: number, installmentsCount: number = 6): string {
  const installmentAmount = Math.round(price / installmentsCount);
  return `${installmentsCount} cuotas sin interés de ${formatCurrencyARS(installmentAmount)}`;
}

/**
 * Total stock across all branches for a given product
 */
export function getTotalStock(product: Product): number {
  return Object.values(product.stockByStore).reduce((acc, qty) => acc + qty, 0);
}

/**
 * Stock label for a specific branch
 */
export function getBranchStockLabel(product: Product, branchId: StoreBranchId): {
  quantity: number;
  label: string;
  badgeClass: string;
} {
  const qty = product.stockByStore?.[branchId] || 0;
  if (qty === 0) {
    return {
      quantity: 0,
      label: 'Bajo Pedido (3-5 d)',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  if (qty <= 3) {
    return {
      quantity: qty,
      label: `¡Últimas ${qty} un.!`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    quantity: qty,
    label: `${qty} disponibles`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

/**
 * Generate an authentic random EAN-13 barcode starting with Argentine GS1 prefix 779
 */
export function generateArgentineBarcode(): string {
  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000).toString();
  const digits = `779${randomSuffix.slice(0, 9)}`; // 12 digits
  
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${digits}${checkDigit}`;
}

/**
 * Format ISO date string into readable Argentine date
 */
export function formatArgentineDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
