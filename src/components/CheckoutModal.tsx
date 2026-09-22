import React from 'react';
import { 
  X, 
  Check, 
  MapPin, 
  Truck, 
  CreditCard, 
  QrCode, 
  Building2, 
  FileText, 
  Printer, 
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  CartItem, 
  StoreBranch, 
  StoreBranchId, 
  DeliveryMethod, 
  PaymentMethod, 
  Order,
  AppUser 
} from '../types';
import { formatCurrencyARS, calculateInstallments } from '../utils/formatters';
import { BrandLogo } from './BrandLogo';
import { apiCreatePaymentPreference } from '../api/client';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  branches: StoreBranch[];
  selectedBranchId: StoreBranchId;
  currentUser?: AppUser | null;
  onCreateOrder: (orderPayload: any) => Promise<Order | null> | void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  branches,
  selectedBranchId,
  currentUser,
  onCreateOrder,
  onOrderSuccess,
}) => {
  // Checkout Steps: 1. Fulfillment & Customer -> 2. Payment -> 3. Success Confirmation
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = React.useState<DeliveryMethod>('pickup');
  const [pickupBranchId, setPickupBranchId] = React.useState<StoreBranchId>(selectedBranchId);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('mercadopago');

  // Customer form state - initialized or populated from logged-in user
  const [customer, setCustomer] = React.useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    dni: '',
    street: '',
    number: '',
    floorApt: '',
    city: '',
    province: 'Buenos Aires',
    postalCode: '',
  });

  React.useEffect(() => {
    if (currentUser) {
      setCustomer((prev) => ({
        ...prev,
        fullName: currentUser.name || prev.fullName,
        email: currentUser.email || prev.email,
      }));
    }
  }, [currentUser]);

  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [mercadoPagoUrl, setMercadoPagoUrl] = React.useState<string | null>(null);

  // Financial calculations
  const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const isTransfer = paymentMethod === 'bank_transfer';
  const discount = isTransfer ? Math.round(subtotal * 0.1) : 0;
  const shippingCost = deliveryMethod === 'delivery' ? 4500 : 0;
  const total = subtotal - discount + shippingCost;

  const currentPickupBranch = branches.find((b) => b.id === pickupBranchId) || branches[0];

  if (!isOpen) return null;

  const handleConfirmOrder = async () => {
    setFormError(null);
    setIsProcessing(true);

    const orderPayload = {
      customer: {
        fullName: customer.fullName.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        dni: customer.dni.trim(),
        address:
          deliveryMethod === 'delivery'
            ? {
                street: customer.street,
                number: customer.number,
                floorApt: customer.floorApt,
                city: customer.city,
                province: customer.province,
                postalCode: customer.postalCode,
              }
            : undefined,
      },
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
      deliveryMethod,
      branchId: deliveryMethod === 'pickup' ? pickupBranchId : undefined,
      paymentMethod,
    };

    try {
      const result = await onCreateOrder(orderPayload);
      if (result) {
        setCreatedOrder(result);
        if (paymentMethod === 'mercadopago') {
          try {
            const pref = await apiCreatePaymentPreference(result.id);
            if (pref.sandboxInitPoint || pref.initPoint) {
              setMercadoPagoUrl(pref.sandboxInitPoint || pref.initPoint);
            }
          } catch (e) {
            console.warn('Could not generate preference', e);
          }
        }
        setStep(3);
        onOrderSuccess(result);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al procesar la orden en el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10A4C7]"></span>
            <h2 className="font-extrabold text-base text-slate-900">
              {step === 3 ? '¡Pedido Confirmado con Éxito!' : 'Finalizar Compra · Megastation'}
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

        {/* Step 1: Customer Data & Fulfillment */}
        {step === 1 && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Notice if backorder items exist */}
            {items.some(
              (i) =>
                i.isBackorder ||
                (i.product.stockByStore?.[selectedBranchId] ?? 0) < i.quantity
            ) && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl flex items-start gap-3 text-xs text-indigo-950 font-medium">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Compra con artículos Bajo Pedido
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tu carrito incluye artículos que se solicitan a distribuidor oficial. <strong>Demora estimada de preparación: 3 a 5 días hábiles</strong>. Te notificaremos por Email y WhatsApp cuando tu pedido esté listo para retiro o despacho.
                  </p>
                </div>
              </div>
            )}

            {/* Fulfillment choice */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Método de Entrega
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pickup in store */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    deliveryMethod === 'pickup'
                      ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <MapPin className="w-4 h-4 text-[#10A4C7]" />
                      <span>Retiro en Sucursal</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ¡GRATIS!
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {items.some(
                      (i) =>
                        i.isBackorder ||
                        (i.product.stockByStore?.[pickupBranchId] ?? 0) < i.quantity
                    )
                      ? 'Demora estimada de preparación: 3 a 5 días hábiles.'
                      : 'Listo en 1 hora en Belgrano o Colegiales.'}
                  </p>
                </button>

                {/* Delivery to address */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    deliveryMethod === 'delivery'
                      ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Truck className="w-4 h-4 text-[#006899]" />
                      <span>Envío a Domicilio</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      $4.500
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cadetería express hoy mismo o Correo Argentino.
                  </p>
                </button>
              </div>
            </div>

            {/* Branch selector if pickup */}
            {deliveryMethod === 'pickup' ? (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700">
                  Seleccioná la sucursal de retiro:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {branches
                    .filter((b) => b.type === 'store')
                    .map((b) => (
                      <label
                        key={b.id}
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                          pickupBranchId === b.id
                            ? 'bg-white border-[#10A4C7] shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="branch"
                          checked={pickupBranchId === b.id}
                          onChange={() => setPickupBranchId(b.id)}
                          className="mt-1 text-[#10A4C7] focus:ring-[#10A4C7]"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-slate-900">{b.name}</div>
                          <div className="text-slate-500">{b.address}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            {b.hours}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            ) : (
              /* Address form for delivery */
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700">
                  Dirección de entrega en Argentina:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Calle</label>
                    <input
                      type="text"
                      value={customer.street}
                      onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                      placeholder="Ej: Av. Monroe"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Altura / Número</label>
                    <input
                      type="text"
                      value={customer.number}
                      onChange={(e) => setCustomer({ ...customer, number: e.target.value })}
                      placeholder="Ej: 2840"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Piso / Depto (Opcional)</label>
                    <input
                      type="text"
                      value={customer.floorApt}
                      onChange={(e) => setCustomer({ ...customer, floorApt: e.target.value })}
                      placeholder="Ej: 5 D"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ciudad / Barrio</label>
                    <input
                      type="text"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      placeholder="Ej: Belgrano, CABA"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Código Postal</label>
                    <input
                      type="text"
                      value={customer.postalCode}
                      onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                      placeholder="Ej: 1428"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Customer Details Form */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Datos del Comprador (Facturación AFIP)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre y Apellido</label>
                  <input
                    type="text"
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">DNI o CUIT</label>
                  <input
                    type="text"
                    value={customer.dni}
                    onChange={(e) => setCustomer({ ...customer, dni: e.target.value })}
                    placeholder="Ej: 38.123.456"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email (Para recibo de compra)</label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="ejemplo@correo.com"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="Ej: +54 11 5566-7788"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#10A4C7]"
                  />
                </div>
              </div>
            </div>

            {/* Form error warning */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Next Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!customer.fullName.trim()) {
                    setFormError('Por favor ingresá tu nombre completo.');
                    return;
                  }
                  if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
                    setFormError('Por favor ingresá un correo electrónico válido para tu comprobante.');
                    return;
                  }
                  if (!customer.phone.trim()) {
                    setFormError('Por favor ingresá un número de teléfono de contacto.');
                    return;
                  }
                  if (deliveryMethod === 'delivery') {
                    if (!customer.street.trim() || !customer.number.trim() || !customer.city.trim()) {
                      setFormError('Por favor completá la calle, altura y localidad de entrega.');
                      return;
                    }
                  }
                  setFormError(null);
                  setStep(2);
                }}
                className="px-6 py-3 bg-[#10A4C7] hover:bg-[#006899] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar al Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Seleccioná tu Medio de Pago
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#10A4C7] font-semibold hover:underline"
                >
                  ← Modificar datos
                </button>
              </div>

              {/* Payment Options */}
              <div className="space-y-2.5">
                {/* Mercado Pago */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'mercadopago'}
                      onChange={() => setPaymentMethod('mercadopago')}
                      className="text-[#10A4C7] focus:ring-[#10A4C7]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Mercado Pago</span>
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Dinero en cuenta, tarjetas de débito o crédito con acreditación inmediata.
                      </div>
                    </div>
                  </div>
                  <QrCode className="w-6 h-6 text-[#006899] opacity-80" />
                </label>

                {/* Transferencia Bancaria con 10% OFF */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-[#10A4C7] focus:ring-[#10A4C7]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Transferencia Bancaria</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          10% OFF EXTRA
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Alias CBU: <strong>MEGASTATION.SHOP</strong> (Banco Galicia)
                      </div>
                    </div>
                  </div>
                  <Building2 className="w-6 h-6 text-emerald-600 opacity-80" />
                </label>

                {/* Tarjeta de Crédito 6 cuotas */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="text-[#10A4C7] focus:ring-[#10A4C7]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        Tarjeta de Crédito / Débito (Visa / Mastercard)
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold">
                        Hasta 6 cuotas sin interés
                      </div>
                    </div>
                  </div>
                  <CreditCard className="w-6 h-6 text-[#10A4C7] opacity-80" />
                </label>

                {/* Pago en mostrador si es retiro */}
                {deliveryMethod === 'pickup' && (
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      paymentMethod === 'cash_pickup'
                        ? 'border-[#10A4C7] bg-sky-50/60 ring-2 ring-[#10A4C7]/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cash_pickup'}
                        onChange={() => setPaymentMethod('cash_pickup')}
                        className="text-[#10A4C7] focus:ring-[#10A4C7]"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Pagar al retirar en la sucursal
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Efectivo, Débito o QR en mostrador ({currentPickupBranch.shortName}).
                        </div>
                      </div>
                    </div>
                    <MapPin className="w-6 h-6 text-amber-500 opacity-80" />
                  </label>
                )}
              </div>
            </div>

            {/* Order summary table */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Resumen de la Orden
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Productos ({items.length})</span>
                  <span>{formatCurrencyARS(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento Transferencia (10%)</span>
                    <span>- {formatCurrencyARS(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Entrega ({deliveryMethod === 'pickup' ? `Retiro en ${currentPickupBranch.shortName}` : 'A Domicilio'})</span>
                  <span>{shippingCost === 0 ? '¡GRATIS!' : formatCurrencyARS(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total a Pagar</span>
                  <span className="text-[#006899]">{formatCurrencyARS(total)}</span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Confirm button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer disabled:opacity-50"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="px-6 py-3.5 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#0e94b4] hover:to-[#005a85] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 transform active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>{isProcessing ? 'Procesando con Servidor...' : 'Confirmar y Finalizar Pedido'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Voucher & Ticket */}
        {step === 3 && createdOrder && (
          <div className="p-6 overflow-y-auto space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                ¡Gracias por tu compra, {createdOrder.customer.fullName}!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Hemos recibido tu pedido correctamente en el sistema. Te enviamos el comprobante fiscal y detalles a <strong>{createdOrder.customer.email}</strong>.
              </p>
            </div>

            {/* Mercado Pago Sandbox Checkout Call to Action */}
            {mercadoPagoUrl && (
              <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl max-w-lg mx-auto space-y-2.5 text-left shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006899]">
                  <CreditCard className="w-4 h-4 text-[#009EE3]" />
                  <span>Pasarela Mercado Pago Sandbox Activa</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tu orden ya fue registrada. Hacé clic para abrir la pasarela de pago de prueba de Mercado Pago:
                </p>
                <a
                  href={mercadoPagoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#009EE3] hover:bg-[#0089c7] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar con Mercado Pago (Modo Sandbox)</span>
                </a>
              </div>
            )}

            {/* Receipt Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3 font-mono text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <BrandLogo size="xs" variant="monochrome" layout="horizontal" />
                <span className="text-[#005A9C] font-bold">ORDEN #{createdOrder.id}</span>
              </div>

              <div className="space-y-1 text-slate-600 text-[11px]">
                <div>Código de Seguimiento: <strong>{createdOrder.trackingNumber}</strong></div>
                <div>Cliente: {createdOrder.customer.fullName} (DNI: {createdOrder.customer.dni})</div>
                <div>
                  Modalidad:{' '}
                  <strong>
                    {createdOrder.deliveryMethod === 'pickup'
                      ? `Retiro en Sucursal ${currentPickupBranch.shortName} (${currentPickupBranch.address})`
                      : `Envío a domicilio: ${createdOrder.customer.address?.street} ${createdOrder.customer.address?.number}`}
                  </strong>
                </div>
                <div>Medio de pago: {createdOrder.paymentMethod.toUpperCase()} ({createdOrder.paymentStatus})</div>
              </div>

              {/* Items in ticket */}
              <div className="border-t border-slate-200 pt-2 space-y-1">
                {createdOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[240px]">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-bold">{formatCurrencyARS(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-xs text-slate-900">
                <span>TOTAL ABONADO:</span>
                <span>{formatCurrencyARS(createdOrder.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket de Compra</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#10A4C7] hover:bg-[#006899] text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
