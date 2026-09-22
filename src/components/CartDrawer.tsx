import React from 'react';
import { 
  X, 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  Barcode,
  Sparkles,
  Clock
} from 'lucide-react';
import { CartItem, StoreBranch, StoreBranchId } from '../types';
import { formatCurrencyARS, calculateInstallments } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  branches: StoreBranch[];
  selectedBranchId: StoreBranchId;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  branches,
  selectedBranchId,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#10A4C7]" />
              <h2 className="font-extrabold text-base text-slate-900">
                Tu Carrito ({totalItemsCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Branch info banner */}
          <div className="bg-sky-50 px-6 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs">
            <span className="text-slate-700 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#10A4C7]" />
              Retiro gratis en: <strong>{currentBranch.shortName}</strong>
            </span>
            <span className="text-emerald-700 font-bold text-[11px]">En 1 hora</span>
          </div>

          {/* Cart Items List */}
          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explorá nuestro catálogo de smartphones, accesorios y tecnología para agregar productos.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 bg-[#10A4C7] text-white font-bold text-xs rounded-xl hover:bg-[#006899] transition-all shadow-xs cursor-pointer"
                >
                  Ver Catálogo de Productos
                </button>
              </div>
            ) : (
              items.map(({ product, quantity, isBackorder }) => {
                const branchStock = product.stockByStore?.[selectedBranchId] ?? 0;
                const isItemOnDemand = isBackorder || quantity > branchStock || branchStock === 0;
                const maxQty = 15;
                const isAtMaxQty = quantity >= maxQty;

                return (
                  <div
                    key={product.id}
                    className="flex gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70 relative group"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-white rounded-xl p-2 border border-slate-200/80 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {product.brand}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                          {product.name}
                        </h4>

                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-[#10A4C7]" />
                          <span>EAN: {product.barcode}</span>
                        </div>

                        {/* Backorder status tag */}
                        {isItemOnDemand && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>Bajo Pedido (3-5 días)</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="font-extrabold text-sm text-slate-900">
                          {formatCurrencyARS(product.price * quantity)}
                        </div>

                        {/* Quantity buttons */}
                        <div className="flex items-center gap-1">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-l cursor-pointer"
                              title="Reducir cantidad"
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-bold text-xs text-slate-800">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isAtMaxQty}
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-r transition-colors ${
                                isAtMaxQty
                                  ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                  : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
                              }`}
                              title={isAtMaxQty ? 'Límite máximo por pedido alcanzado (15 un.)' : 'Aumentar cantidad'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Checkout action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
              {/* Backorder notice in footer */}
              {items.some(
                (i) =>
                  i.isBackorder ||
                  (i.product.stockByStore?.[selectedBranchId] ?? 0) < i.quantity
              ) && (
                <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-start gap-2 text-[11px] text-indigo-950 font-medium">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    Tu compra incluye artículos <strong>bajo pedido</strong>. Tiempo estimado de preparación: <strong>3 a 5 días hábiles</strong>.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal productos</span>
                  <span>{formatCurrencyARS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Retiro en Sucursal ({currentBranch.shortName})</span>
                  <span>¡GRATIS!</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total estimado</span>
                  <span>{formatCurrencyARS(subtotal)}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {calculateInstallments(subtotal, 6)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#0e94b4] hover:to-[#005a85] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
              >
                <span>Iniciar Compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10A4C7]" />
                <span>Compra protegida con garantía oficial escrita</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
