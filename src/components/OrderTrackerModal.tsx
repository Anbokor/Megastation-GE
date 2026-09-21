import React from 'react';
import { 
  X, 
  Search, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle,
  Barcode
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatCurrencyARS, formatArgentineDate } from '../utils/formatters';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [searchCode, setSearchCode] = React.useState('');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(orders[0] || null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    const found = orders.find(
      (o) =>
        o.id.toLowerCase().includes(searchCode.toLowerCase().trim()) ||
        o.trackingNumber.toLowerCase().includes(searchCode.toLowerCase().trim()) ||
        o.customer.dni.includes(searchCode.trim())
    );
    if (found) {
      setSelectedOrder(found);
    }
  };

  const getStatusStep = (status: OrderStatus): number => {
    switch (status) {
      case 'pendiente':
        return 1;
      case 'en_preparacion':
        return 2;
      case 'listo_retiro':
      case 'en_camino':
        return 3;
      case 'entregado':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = selectedOrder ? getStatusStep(selectedOrder.orderStatus) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#10A4C7]" />
            <h2 className="font-extrabold text-base text-slate-900">
              Seguimiento de Pedidos y Envíos
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

        {/* Search Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Ingresá N° de orden (ej: MGST-2026-0841), código o DNI..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#10A4C7] focus:ring-2 focus:ring-[#10A4C7]/20"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#10A4C7] hover:bg-[#006899] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Buscar
            </button>
          </form>

          {/* Quick chip selection of loaded orders */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-medium">Órdenes recientes:</span>
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOrder(o)}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all whitespace-nowrap ${
                  selectedOrder?.id === o.id
                    ? 'bg-[#006899] text-white border-[#006899] font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {o.id} ({o.customer.fullName.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Top Order Summary Card */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#006899]">
                      {selectedOrder.id}
                    </span>
                    <span className="bg-white text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200">
                      Tracking: {selectedOrder.trackingNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Cliente: <strong>{selectedOrder.customer.fullName}</strong> · DNI: {selectedOrder.customer.dni}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Fecha: {formatArgentineDate(selectedOrder.createdAt)}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-sky-200 sm:pl-4">
                  <div className="text-xs text-slate-500 font-medium">Total abonado</div>
                  <div className="text-xl font-black text-slate-900">
                    {formatCurrencyARS(selectedOrder.total)}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Pago Acreditado ({selectedOrder.paymentMethod.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Visual Step Progress Bar */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estado del Pedido en Tiempo Real
                </label>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                        currentStep >= 1
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">1. Recibido</div>
                    <div className="text-[10px] text-slate-400">Pago confirmado</div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                        currentStep >= 2
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">2. Preparando</div>
                    <div className="text-[10px] text-slate-400">Separando stock</div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                        currentStep >= 3
                          ? 'bg-[#10A4C7] text-white ring-4 ring-sky-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {selectedOrder.deliveryMethod === 'pickup' ? (
                        <MapPin className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>
                    <div className="font-bold text-[#006899] text-[11px]">
                      {selectedOrder.deliveryMethod === 'pickup' ? '3. Para Retirar' : '3. En Camino'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedOrder.deliveryMethod === 'pickup' ? 'En mostrador' : 'Con cadete'}
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                        currentStep >= 4
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">4. Entregado</div>
                    <div className="text-[10px] text-slate-400">Finalizado</div>
                  </div>
                </div>
              </div>

              {/* Detailed Status History Timeline */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registro de Actividad & Logística
                </label>
                <div className="space-y-2 border-l-2 border-[#10A4C7] pl-4 ml-2">
                  {selectedOrder.statusHistory.map((item, idx) => (
                    <div key={idx} className="relative space-y-0.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10A4C7] absolute -left-[21px] top-1"></div>
                      <div className="font-bold text-slate-800 capitalize">
                        {item.status.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatArgentineDate(item.timestamp)}
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items included in this order */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Artículos de la Orden
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          EAN: {item.barcode} · Cantidad: {item.quantity} un.
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrencyARS(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No se seleccionó ninguna orden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
