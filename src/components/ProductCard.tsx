import React from 'react';
import { 
  ShoppingCart, 
  Eye, 
  MapPin, 
  Star, 
  Check, 
  Barcode 
} from 'lucide-react';
import { Product, StoreBranchId } from '../types';
import { formatCurrencyARS, calculateInstallments, getBranchStockLabel } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  selectedBranchId: StoreBranchId;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedBranchId,
  onSelectProduct,
  onAddToCart,
}) => {
  const [added, setAdded] = React.useState(false);

  const currentBranchStock = getBranchStockLabel(product, selectedBranchId);
  const totalStock = Object.values(product.stockByStore || {}).reduce((a, b) => a + (b || 0), 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#10A4C7]/60 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Top badges: Tags and Barcode info */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-wrap gap-1">
          {product.featured && (
            <span className="bg-[#10A4C7] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Destacado
            </span>
          )}
          <span className="bg-slate-900/80 text-white backdrop-blur-xs text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {product.brand}
          </span>
        </div>

        {/* Mini barcode pill */}
        <div className="bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs flex items-center gap-1">
          <Barcode className="w-3 h-3 text-[#006899]" />
          <span>{product.barcode.slice(-5)}</span>
        </div>
      </div>

      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-50 overflow-hidden flex items-center justify-center p-4">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Agotado Temporalmente
            </span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <div className="flex items-center text-[#FFB000]">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-semibold text-slate-700">{product.rating}</span>
            <span className="text-slate-400">({product.reviewsCount})</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-[#006899] transition-colors">
            {product.name}
          </h3>

          {/* Quick Specs summary */}
          {product.specs.storage && (
            <p className="text-[11px] text-slate-500 mt-1">
              {product.specs.storage} {product.specs.color ? `· ${product.specs.color}` : ''}
            </p>
          )}
        </div>

        {/* Pricing Section */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrencyARS(product.price)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
            {calculateInstallments(product.price, 6)}
          </div>
        </div>

        {/* Branch stock status indicator */}
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-[#10A4C7]" />
              {selectedBranchId === 'belgrano' ? 'Belgrano' : 'Colegiales'}:
            </span>
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${currentBranchStock.badgeClass}`}>
              {currentBranchStock.label}
            </span>
          </div>

          {/* Multi-branch quick peek */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>En otra sucursal:</span>
            <span className="font-medium text-slate-600">
              {selectedBranchId === 'belgrano'
                ? `Colegiales (${product.stockByStore?.colegiales ?? 0} u.)`
                : `Belgrano (${product.stockByStore?.belgrano ?? 0} u.)`}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={currentBranchStock.quantity === 0}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              added
                ? 'bg-emerald-600 text-white'
                : currentBranchStock.quantity === 0
                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#10A4C7] hover:bg-[#0e94b4] active:bg-[#006899] text-white hover:shadow-md cursor-pointer'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Agregado!</span>
              </>
            ) : currentBranchStock.quantity === 0 ? (
              <span>Sin Stock en Sucursal</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar al Carrito</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            title="Ver especificaciones completas"
            className="p-2.5 rounded-xl border border-slate-200 hover:border-[#10A4C7] text-slate-600 hover:text-[#006899] hover:bg-sky-50/50 transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
