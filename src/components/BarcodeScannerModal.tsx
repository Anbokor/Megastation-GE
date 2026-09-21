import React from 'react';
import { 
  X, 
  Barcode, 
  Search, 
  Check, 
  ShoppingCart, 
  Eye, 
  MapPin, 
  Sparkles 
} from 'lucide-react';
import { Product, StoreBranchId } from '../types';
import { BarcodeVisual } from './BarcodeVisual';
import { formatCurrencyARS } from '../utils/formatters';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedBranchId: StoreBranchId;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedBranchId,
  onSelectProduct,
  onAddToCart,
}) => {
  const [inputCode, setInputCode] = React.useState('');
  const [scannedProduct, setScannedProduct] = React.useState<Product | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  if (!isOpen) return null;

  const handleScan = (code: string) => {
    setInputCode(code);
    setHasSearched(true);
    const found = products.find(
      (p) => p.barcode.trim() === code.trim() || p.barcode.slice(-6) === code.trim()
    );
    setScannedProduct(found || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleScan(inputCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-[#10A4C7]" />
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Escanear Código de Barras (EAN-13)
              </h2>
              <p className="text-[11px] text-slate-500">
                Identificación de producto y consulta de stock instantáneo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form and Samples */}
        <div className="p-6 space-y-5">
          {/* Laser beam animation frame */}
          <div className="relative bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse pointer-events-none"></div>
            <Barcode className="w-24 h-24 text-slate-700 opacity-60" />
            <span className="text-[11px] text-[#48FEC1] font-mono mt-2 tracking-wider">
              [ LECTOR ÓPTICO LISTO ]
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Ingresá o pegá los 13 dígitos del código..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:border-[#10A4C7] focus:bg-white focus:ring-2 focus:ring-[#10A4C7]/20 text-slate-900"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#10A4C7] hover:bg-[#006899] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Consultar
            </button>
          </form>

          {/* Quick scan chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Códigos de prueba en tienda:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleScan(p.barcode)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-[#006899] hover:border-[#10A4C7] border border-slate-200 rounded-lg text-xs font-mono transition-colors"
                >
                  {p.barcode} ({p.brand})
                </button>
              ))}
            </div>
          </div>

          {/* Scanned Result */}
          {scannedProduct ? (
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={scannedProduct.image}
                  alt={scannedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 bg-white rounded-xl p-1.5 border border-slate-200 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#006899]">
                    {scannedProduct.brand}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {scannedProduct.name}
                  </h4>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {formatCurrencyARS(scannedProduct.price)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Stock en tu sucursal: <strong>{scannedProduct.stockByStore[selectedBranchId] || 0} un.</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(scannedProduct);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 bg-[#10A4C7] hover:bg-[#006899] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Agregar al Carrito</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectProduct(scannedProduct);
                    onClose();
                  }}
                  className="py-2 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha</span>
                </button>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="p-4 text-center bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              No se encontró ningún artículo registrado con el código ingresado.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
