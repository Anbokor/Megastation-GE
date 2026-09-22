import React from 'react';
import { 
  X, 
  ShoppingCart, 
  Check, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Star, 
  Cpu, 
  HardDrive, 
  Battery, 
  Smartphone, 
  Camera, 
  Calendar,
  Share2
} from 'lucide-react';
import { Product, StoreBranch, StoreBranchId } from '../types';
import { BarcodeVisual } from './BarcodeVisual';
import { formatCurrencyARS, calculateInstallments } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  branches: StoreBranch[];
  selectedBranchId: StoreBranchId;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  branches,
  selectedBranchId,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    setQuantity(1);
    setAdded(false);
  }, [product?.id]);

  if (!product) return null;

  const totalStock = Object.values(product.stockByStore || {}).reduce((a, b) => a + (b || 0), 0);

  const handleAdd = () => {
    if (added) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10A4C7] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              {product.brand}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              Categoría: {product.category.replace('_', ' ')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left side: Product Image & Barcode */}
            <div className="md:col-span-5 space-y-4">
              <div className="aspect-square bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex items-center justify-center relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>

              {/* Barcode component with EAN visual */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
                  Código de Barras Oficial (EAN-13)
                </span>
                <BarcodeVisual value={product.barcode} height={40} interactive={false} />
                <span className="text-[10px] text-slate-400">
                  Utilizado para control de stock y escaneo en caja
                </span>
              </div>
            </div>

            {/* Right side: Info, Pricing, Multi-store Stock */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center text-[#FFB000]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount} opiniones verificadas)</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h1>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price block */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1.5">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrencyARS(product.price)}
                </div>
                <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{calculateInstallments(product.price, 6)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Precio especial de contado por transferencia bancaria: <strong>{formatCurrencyARS(product.price * 0.9)}</strong> (10% OFF adicional)
                </div>
              </div>

              {/* Multi-Store Stock Availability Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#10A4C7]" />
                    Stock en Sucursales Megastation
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Total disponible: <strong>{totalStock} unidades</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {branches.map((b) => {
                    const qty = product.stockByStore[b.id] || 0;
                    const hasStock = qty > 0;
                    return (
                      <div
                        key={b.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          hasStock
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="font-bold text-slate-800">{b.shortName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{b.address}</div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span
                            className={`font-semibold text-[11px] ${
                              hasStock ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {hasStock ? `${qty} un.` : 'Sin stock'}
                          </span>
                          {b.isPickupAvailable && hasStock && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                              Retiro 1h
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity and Add to Cart action */}
              {(() => {
                const branchStockQty = product.stockByStore[selectedBranchId] ?? 0;
                const isOutOfStock = branchStockQty === 0;

                return (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                      <button
                        type="button"
                        disabled={quantity <= 1 || isOutOfStock}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-slate-800">
                        {isOutOfStock ? 0 : quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= branchStockQty || isOutOfStock}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleAdd}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                        added
                          ? 'bg-emerald-600 text-white'
                          : isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#10A4C7] hover:bg-[#006899] text-white cursor-pointer'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>¡Agregado al Carrito!</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Agotado en esta sucursal</span>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          <span>Agregar al Carrito ({quantity})</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}

              {/* Purchase advantages */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10A4C7]" />
                  <span>Garantía escrita 12 meses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#006899]" />
                  <span>Envíos a todo el país</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical specifications table */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Ficha Técnica & Especificaciones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {product.specs.screen && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#10A4C7] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pantalla</div>
                    <div className="text-xs font-semibold text-slate-800">{product.specs.screen}</div>
                  </div>
                </div>
              )}

              {product.specs.processor && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-[#006899] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Procesador</div>
                    <div className="text-xs font-semibold text-slate-800">{product.specs.processor}</div>
                  </div>
                </div>
              )}

              {product.specs.storage && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-[#10A4C7] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Memoria / Almacenamiento</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {product.specs.ram ? `${product.specs.ram} RAM / ` : ''} {product.specs.storage}
                    </div>
                  </div>
                </div>
              )}

              {product.specs.camera && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-[#006899] mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cámara</div>
                    <div className="text-xs font-semibold text-slate-800">{product.specs.camera}</div>
                  </div>
                </div>
              )}

              {product.specs.battery && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Battery className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Batería & Autonomía</div>
                    <div className="text-xs font-semibold text-slate-800">{product.specs.battery}</div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#FFB000] mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Garantía Megastation</div>
                  <div className="text-xs font-semibold text-slate-800">
                    {product.specs.warrantyMonths} meses oficial escrita
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
