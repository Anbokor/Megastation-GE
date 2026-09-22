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
import { Order, OrderStatus, AppUser } from '../types';
import { formatCurrencyARS, formatArgentineDate } from '../utils/formatters';
import { apiTrackOrder } from '../api/client';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currentUser?: AppUser | null;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentUser,
}) => {
  const [searchCode, setSearchCode] = React.useState('');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Filter accessible orders strictly based on user role to prevent privacy leaks
  const userOrders = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'customer') {
      return orders.filter(
        (o) => o.customer.email.toLowerCase() === currentUser.email.toLowerCase()
      );
    }
    // Staff (admin / seller) can view recent orders in tracker
    if (currentUser.role === 'admin' || currentUser.role === 'seller') {
      return orders;
    }
    return [];
  }, [orders, currentUser]);

  // When opening or when user orders change, select the user's latest order if available
  React.useEffect(() => {
    if (isOpen) {
      if (userOrders.length > 0) {
        setSelectedOrder(userOrders[0]);
      } else {
        setSelectedOrder(null);
      }
      setSearchCode('');
      setSearchError(null);
    }
  }, [isOpen, userOrders]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const clean = searchCode.trim();
    if (!clean) return;

    setIsSearching(true);
    try {
      const order = await apiTrackOrder(clean);
      setSelectedOrder(order);
    } catch {
      // Fallback to local passed orders if offline or not synced
      const found = orders.find(
        (o) =>
          o.id.toLowerCase() === clean.toLowerCase() ||
          o.trackingNumber.toLowerCase() === clean.toLowerCase()
      );
      if (found) {
        setSelectedOrder(found);
      } else {
        setSearchError('No se encontró ninguna orden con el código ingresado.');
        setSelectedOrder(null);
      }
    } finally {
      setIsSearching(false);
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
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Ingresá N° de orden (ej: MGST-2026-0841) o código de seguimiento..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#10A4C7] focus:ring-2 focus:ring-[#10A4C7]/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-[#10A4C7] hover:bg-[#006899] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {searchError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* User's personal orders chips or staff authorized chips */}
          {userOrders.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto text-[11px] no-scrollbar">
              <span className="text-slate-400 font-medium whitespace-nowrap">
                {currentUser?.role === 'customer' ? 'Tus órdenes:' : 'Órdenes recientes:'}
              </span>
              {userOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrder(o)}
                  className={`px-2.5 py-1 rounded-lg border font-mono transition-all whitespace-nowrap cursor-pointer ${
                    selectedOrder?.id === o.id
                      ? 'bg-[#006899] text-white border-[#006899] font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {o.id} {currentUser?.role !== 'customer' && `(${o.customer.fullName.split(' ')[0]})`}
                </button>
              ))}
            </div>
          )}
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

                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total abonado</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {formatCurrencyARS(selectedOrder.total)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                    {selectedOrder.paymentStatus === 'paid' ? 'Pago Acreditado' : 'Pago Pendiente'}
                  </span>
                </div>
              </div>

              {/* Delivery method and destination */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#10A4C7] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {selectedOrder.deliveryMethod === 'pickup'
                      ? 'Modalidad: Retiro en Sucursal Megastation'
                      : 'Modalidad: Envío a Domicilio'}
                  </div>
                  {selectedOrder.deliveryMethod === 'pickup' ? (
                    <div>
                      Retirar en:{' '}
                      <span className="font-semibold text-slate-800">
                        Sucursal {selectedOrder.branchId === 'colegiales' ? 'Colegiales' : 'Belgrano'}
                      </span>{' '}
                      (Presentar DNI del titular o código de retiro)
                    </div>
                  ) : (
                    <div>
                      Destino:{' '}
                      <span className="font-semibold text-slate-800">
                        {selectedOrder.customer.address?.street} {selectedOrder.customer.address?.number}
                        {selectedOrder.customer.address?.floorApt && `, ${selectedOrder.customer.address.floorApt}`}
                      </span>{' '}
                      ({selectedOrder.customer.address?.city}, {selectedOrder.customer.address?.province})
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Logistics Progress Stepper */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6">
                <div className="grid grid-cols-4 gap-2 relative">
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>
                  <div
                    className="absolute top-4 left-6 h-0.5 bg-[#10A4C7] transition-all duration-500 -z-0"
                    style={{
                      width: `${((currentStep - 1) / 3) * 100}%`,
                    }}
                  ></div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10 space-y-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStep >= 1
                          ? 'bg-[#10A4C7] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">1. Pendiente</div>
                    <div className="text-[10px] text-slate-400">Orden recibida</div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10 space-y-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStep >= 2
                          ? 'bg-[#10A4C7] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">2. En Preparación</div>
                    <div className="text-[10px] text-slate-400">Embalando productos</div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10 space-y-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStep >= 3
                          ? 'bg-[#10A4C7] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-800 text-[11px]">
                      {selectedOrder.deliveryMethod === 'pickup' ? '3. Listo para Retiro' : '3. En Camino'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedOrder.deliveryMethod === 'pickup' ? 'En mostrador sucursal' : 'Despachado con transporte'}
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center relative z-10 space-y-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStep >= 4
                          ? 'bg-emerald-500 text-white shadow-xs'
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
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#006899] flex items-center justify-center mx-auto border border-sky-100">
                <Search className="w-6 h-6 text-[#10A4C7]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Consultá el estado de tu compra
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Ingresá en el buscador superior el número de orden (ej: MGST-2026-0841) o el código de tracking recibido en tu confirmación de compra para ver el estado del envío en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
