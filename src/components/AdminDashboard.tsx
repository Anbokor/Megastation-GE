import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  BarChart3, 
  Package, 
  FileSpreadsheet, 
  Barcode, 
  ArrowRightLeft, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Search, 
  MapPin, 
  AlertTriangle,
  Scan,
  RefreshCw,
  Edit2,
  ShieldCheck,
  Store
} from 'lucide-react';
import { 
  Product, 
  StoreBranch, 
  StoreBranchId, 
  Order, 
  ProductCategory,
  InboundInvoiceItem,
  AppUser
} from '../types';
import { CATEGORIES } from '../data/initialData';
import { formatCurrencyARS, generateArgentineBarcode } from '../utils/formatters';
import { BarcodeVisual } from './BarcodeVisual';
import { BrandLogo } from './BrandLogo';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  products: Product[];
  branches: StoreBranch[];
  orders: Order[];
  onUpdateProductStock: (productId: string, branchId: StoreBranchId, newQty: number) => void;
  onTransferStock: (productId: string, fromBranch: StoreBranchId, toBranch: StoreBranchId, qty: number) => void;
  onAddInboundStock: (item: InboundInvoiceItem) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: any) => void;
  onOpenBrandbookModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  products,
  branches,
  orders,
  onUpdateProductStock,
  onTransferStock,
  onAddInboundStock,
  onUpdateOrderStatus,
  onOpenBrandbookModal,
}) => {
  const isSeller = currentUser?.role === 'seller';
  const isAdmin = currentUser?.role === 'admin';
  const userBranch = branches.find((b) => b.id === currentUser?.branchId) || branches[0];

  // Active Tab: 'analytics' | 'invoicing' | 'inventory' | 'pos_scanner' | 'orders'
  const [activeTab, setActiveTab] = React.useState<
    'analytics' | 'invoicing' | 'inventory' | 'pos_scanner' | 'orders'
  >('analytics');

  // When opening or when role changes, set sensible default tab
  useEffect(() => {
    if (isSeller) {
      setActiveTab('pos_scanner');
    } else {
      setActiveTab('analytics');
    }
  }, [isSeller, isOpen]);

  // Inbound invoice / Remito state
  const [selectedProductId, setSelectedProductId] = React.useState<string>(products[0]?.id || '');
  const [costPrice, setCostPrice] = React.useState<number>(products[0]?.costPrice || 10000);
  const [desiredMargin, setDesiredMargin] = React.useState<number>(40);
  const [manualSellingPrice, setManualSellingPrice] = React.useState<number>(0);
  const [invoiceQty, setInvoiceQty] = React.useState<number>(10);
  const [targetBranch, setTargetBranch] = React.useState<StoreBranchId>('belgrano');
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = React.useState<string | null>(null);

  // Transfer stock state
  const [transferProdId, setTransferProdId] = React.useState<string>(products[0]?.id || '');
  const [transferFrom, setTransferFrom] = React.useState<StoreBranchId>('central');
  const [transferTo, setTransferTo] = React.useState<StoreBranchId>('belgrano');
  const [transferQty, setTransferQty] = React.useState<number>(5);
  const [transferSuccessMsg, setTransferSuccessMsg] = React.useState<string | null>(null);

  // POS Scanner state
  const [scannedBarcode, setScannedBarcode] = React.useState<string>('');
  const [scannedProduct, setScannedProduct] = React.useState<Product | null>(null);

  // Search in inventory list
  const [inventorySearch, setInventorySearch] = React.useState('');

  // Selected product object for invoice calculator
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Auto calculate suggested price based on cost & margin
  const calculatedSuggestedPrice = React.useMemo(() => {
    if (costPrice <= 0) return 0;
    // Markup formula: Price = Cost * (1 + margin / 100)
    return Math.round(costPrice * (1 + desiredMargin / 100));
  }, [costPrice, desiredMargin]);

  // When active product changes, sync default category margin
  React.useEffect(() => {
    if (activeProduct) {
      setCostPrice(activeProduct.costPrice || Math.round(activeProduct.price * 0.75));
      const catInfo = CATEGORIES.find((c) => c.id === activeProduct.category);
      const defMargin = catInfo ? catInfo.defaultMarginPercent : 35;
      setDesiredMargin(defMargin);
      setManualSellingPrice(activeProduct.price);
    }
  }, [selectedProductId]);

  // Handle invoice submission
  const handleProcessInboundInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    const finalPrice = manualSellingPrice > 0 ? manualSellingPrice : calculatedSuggestedPrice;

    const invoiceItem: InboundInvoiceItem = {
      id: `INV-ITEM-${Date.now()}`,
      productId: activeProduct.id,
      productName: activeProduct.name,
      category: activeProduct.category,
      barcode: activeProduct.barcode,
      quantity: Number(invoiceQty),
      costPrice: Number(costPrice),
      desiredMarginPercent: Number(desiredMargin),
      suggestedPrice: calculatedSuggestedPrice,
      finalPrice,
      targetBranch,
    };

    onAddInboundStock(invoiceItem);
    setInvoiceSuccessMsg(
      `¡Ingreso exitoso! Se sumaron ${invoiceQty} un. a ${targetBranch.toUpperCase()} con precio de venta actualizado a ${formatCurrencyARS(finalPrice)}.`
    );
    setTimeout(() => setInvoiceSuccessMsg(null), 4000);
  };

  // Handle transfer
  const handleProcessTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFrom === transferTo) {
      alert('La sucursal de origen y destino deben ser distintas.');
      return;
    }
    onTransferStock(transferProdId, transferFrom, transferTo, transferQty);
    setTransferSuccessMsg(
      `Transferencia exitosa: ${transferQty} unidades enviadas de ${transferFrom.toUpperCase()} a ${transferTo.toUpperCase()}.`
    );
    setTimeout(() => setTransferSuccessMsg(null), 4000);
  };

  // Handle barcode scanner test
  const handleScanBarcode = (code: string) => {
    setScannedBarcode(code);
    const found = products.find((p) => p.barcode.trim() === code.trim());
    setScannedProduct(found || null);
  };

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const avgTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const totalInventoryValuation = products.reduce((sum, p) => {
    const totalQty = Object.values(p.stockByStore).reduce((a, b) => a + b, 0);
    return sum + p.price * totalQty;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[94vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10A4C7] to-[#48FEC1] flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              {isSeller ? <Store className="w-5 h-5 text-slate-900" /> : <ShieldCheck className="w-5 h-5 text-slate-900" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white tracking-tight">
                  {isSeller
                    ? `Terminal Punto de Venta & Sucursal ${userBranch.shortName}`
                    : 'Panel de Administración General & Finanzas'}
                </h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  isSeller ? 'bg-[#48FEC1] text-slate-900' : 'bg-[#FFB000] text-slate-900'
                }`}>
                  {isSeller ? 'Vendedor' : 'Administrador'}
                </span>
              </div>
              <p className="text-[11px] text-sky-200">
                {isSeller
                  ? `Operador: ${currentUser?.name || 'Ventas'} · ${userBranch.address} (${userBranch.phone})`
                  : `Administrador: ${currentUser?.name || 'Roberto Méndez'} · Acceso Total Multi-Sucursal (Belgrano / Colegiales / Central)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Role Gated) */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-bold no-scrollbar">
          {/* Admin-only tabs */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-white text-[#006899] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#10A4C7]" />
                <span>Métricas & Ventas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invoicing')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'invoicing'
                    ? 'bg-white text-[#006899] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ingreso de Mercadería & Margen %</span>
              </button>
            </>
          )}

          {/* Common tabs */}
          {isSeller && (
            <button
              type="button"
              onClick={() => setActiveTab('pos_scanner')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pos_scanner'
                  ? 'bg-white text-[#006899] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan className="w-4 h-4 text-[#10A4C7]" />
              <span>Lector de Código de Barras (POS)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-[#006899] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-[#FFB000]" />
            <span>{isSeller ? 'Stock de Sucursales' : 'Stock Multi-Sucursal & Transferencias'}</span>
          </button>

          {!isSeller && (
            <button
              type="button"
              onClick={() => setActiveTab('pos_scanner')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pos_scanner'
                  ? 'bg-white text-[#006899] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan className="w-4 h-4 text-[#10A4C7]" />
              <span>Lector POS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-[#006899] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>{isSeller ? 'Despacho de Pedidos' : 'Gestión de Pedidos'} ({orders.length})</span>
          </button>
        </div>

        {/* Tab 1: Analytics & Metrics */}
        {activeTab === 'analytics' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Facturación Total</span>
                <div className="text-2xl font-black text-slate-900">{formatCurrencyARS(totalRevenue)}</div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18.4% este mes
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Órdenes Completadas</span>
                <div className="text-2xl font-black text-slate-900">{totalOrdersCount} pedidos</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Ticket Promedio: {formatCurrencyARS(avgTicket)}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Valuación de Stock</span>
                <div className="text-2xl font-black text-[#006899]">{formatCurrencyARS(totalInventoryValuation)}</div>
                <div className="text-[11px] text-slate-500">
                  {products.length} modelos en catálogo
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Margen Promedio</span>
                <div className="text-2xl font-black text-emerald-700">42.5%</div>
                <div className="text-[11px] text-slate-500">Rentabilidad sobre costo</div>
              </div>
            </div>

            {/* Branch Sales & Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#10A4C7]" />
                  Rendimiento por Punto de Venta
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Sucursal Belgrano (Av. Cabildo 2995)</span>
                      <span className="text-slate-900 font-bold">58% de las ventas</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#10A4C7] h-2.5 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Sucursal Colegiales (Av. Elcano 3096)</span>
                      <span className="text-slate-900 font-bold">32% de las ventas</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#006899] h-2.5 rounded-full" style={{ width: '32%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Depósito Central (Envíos a Domicilio)</span>
                      <span className="text-slate-900 font-bold">10% de las ventas</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#48FEC1] h-2.5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Alertas de Stock Bajo (&lt; 4 un.)
                </h3>

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {products
                    .filter((p) => (p.stockByStore.belgrano <= 3 || p.stockByStore.colegiales <= 3))
                    .map((p) => (
                      <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">EAN: {p.barcode}</div>
                        </div>
                        <div className="text-right font-semibold">
                          <span className="text-amber-600">
                            Bel: {p.stockByStore.belgrano} u. | Col: {p.stockByStore.colegiales} u.
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invoicing & Markup Calculator (Накладные с наценкой) */}
        {activeTab === 'invoicing' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
              <strong>Módulo de Ingreso de Mercadería & Fijación de Precios:</strong> Ingrese el costo de compra del proveedor y el porcentaje de margen deseado según la categoría. El sistema calculará el precio de venta sugerido en pesos argentinos, permitiendo su ajuste manual antes de actualizar el stock de la sucursal.
            </div>

            {invoiceSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{invoiceSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleProcessInboundInvoice} className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Product */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    1. Seleccionar Producto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:border-[#10A4C7]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — [EAN: {p.barcode}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Cost Price */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    2. Precio de Costo de Compra ($ ARS)
                  </label>
                  <div className="relative mt-1">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-[#10A4C7]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Costo neto de factura del importador/distribuidor</span>
                </div>

                {/* Desired Markup Percentage */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    3. Margen de Ganancia Deseado (%)
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={desiredMargin}
                      onChange={(e) => setDesiredMargin(Number(e.target.value))}
                      className="w-28 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-[#10A4C7]"
                      required
                    />
                    <div className="flex gap-1.5">
                      {[25, 35, 50, 65].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDesiredMargin(pct)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            desiredMargin === pct
                              ? 'bg-[#10A4C7] text-white border-[#10A4C7]'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">Sugerido para {activeProduct?.category}: {desiredMargin}%</span>
                </div>

                {/* Suggested vs Final Price */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    Cálculo Automático de Precio Sugerido
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {formatCurrencyARS(calculatedSuggestedPrice)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ganancia neta estimada por unidad: <strong>{formatCurrencyARS(calculatedSuggestedPrice - costPrice)}</strong>
                  </div>
                </div>

                {/* Final Override Selling Price */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-700">
                    4. Precio de Venta Final al Público ($ ARS)
                  </label>
                  <input
                    type="number"
                    step={100}
                    value={manualSellingPrice || calculatedSuggestedPrice}
                    onChange={(e) => setManualSellingPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500">
                    Permite corregir o redondear el precio final.
                  </span>
                </div>

                {/* Quantity and Target Branch */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    5. Cantidad Ingresada
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={invoiceQty}
                    onChange={(e) => setInvoiceQty(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    6. Sucursal de Destino
                  </label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value as StoreBranchId)}
                    className="w-full mt-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#10A4C7] hover:bg-[#006899] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Procesar Remito & Actualizar Stock y Precio</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Multi-Store Inventory & Transfers */}
        {activeTab === 'inventory' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Transfer Tool */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#10A4C7]" />
                Transferencia Interna entre Sucursales
              </h3>

              {transferSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  {transferSuccessMsg}
                </div>
              )}

              <form onSubmit={handleProcessTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Producto</label>
                  <select
                    value={transferProdId}
                    onChange={(e) => setTransferProdId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Desde (Origen)</label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value as StoreBranchId)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Hacia (Destino)</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value as StoreBranchId)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-[#006899] hover:bg-[#10A4C7] text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Transferir {transferQty} un.
                  </button>
                </div>
              </form>
            </div>

            {/* Inventory table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Stock Detallado por Sucursal ({products.length} productos)
                </span>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Filtrar por nombre o EAN..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Producto / EAN</th>
                      <th className="p-3 text-center">Belgrano</th>
                      <th className="p-3 text-center">Colegiales</th>
                      <th className="p-3 text-center">Central</th>
                      <th className="p-3 text-right">Precio Venta</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.barcode.includes(inventorySearch)
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3 text-[#10A4C7]" />
                              <span>{p.barcode}</span>
                            </div>
                          </td>

                          {/* Stock Belgrano */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore.belgrano}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'belgrano', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          </td>

                          {/* Stock Colegiales */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore.colegiales}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'colegiales', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          </td>

                          {/* Stock Central */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore.central}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'central', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          </td>

                          <td className="p-3 text-right font-black text-slate-900">
                            {formatCurrencyARS(p.price)}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setActiveTab('invoicing');
                              }}
                              className="text-[11px] text-[#10A4C7] font-bold hover:underline"
                            >
                              Remito
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: POS Barcode Scanner (Lector de Código de Barras) */}
        {activeTab === 'pos_scanner' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[#48FEC1]" />
                  <h3 className="font-extrabold text-sm text-white">
                    Simulador de Pistola Lectora de Código de Barras (POS)
                  </h3>
                </div>
                <span className="text-[10px] bg-white/20 text-[#48FEC1] px-2 py-0.5 rounded font-mono">
                  Lector EAN-13 Activo
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedBarcode}
                  onChange={(e) => handleScanBarcode(e.target.value)}
                  placeholder="Escaneá o pegá un código de barras (ej: 7798001001018)..."
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white font-mono text-sm rounded-xl focus:border-[#48FEC1] focus:ring-2 focus:ring-[#48FEC1]/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleScanBarcode(products[0]?.barcode || '')}
                  className="px-4 py-3 bg-[#48FEC1] text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-300 transition-colors"
                >
                  Probar Demo
                </button>
              </div>

              {/* Sample clickable barcodes to test immediately */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Códigos de muestra para escanear con 1-click:
                </span>
                <div className="flex flex-wrap gap-2">
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleScanBarcode(p.barcode)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                    >
                      {p.brand}: {p.barcode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scanned Result Card */}
            {scannedProduct ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src={scannedProduct.image}
                      alt={scannedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 bg-white rounded-xl p-2 border border-slate-200 object-contain"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {scannedProduct.brand}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1">
                        {scannedProduct.name}
                      </h4>
                      <div className="text-xl font-black text-slate-900 mt-1">
                        {formatCurrencyARS(scannedProduct.price)}
                      </div>
                    </div>
                  </div>

                  <BarcodeVisual value={scannedProduct.barcode} height={36} />
                </div>

                {/* Real-time Branch Stock for this scanned item */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sucursal Belgrano</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {scannedProduct.stockByStore.belgrano} un.
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sucursal Colegiales</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {scannedProduct.stockByStore.colegiales} un.
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Depósito Central</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {scannedProduct.stockByStore.central} un.
                    </div>
                  </div>
                </div>
              </div>
            ) : scannedBarcode ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No se encontró ningún producto con el código <strong>{scannedBarcode}</strong>.
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 5: Orders Management */}
        {activeTab === 'orders' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Listado de Órdenes & Actualización de Estados
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID / Cliente</th>
                    <th className="p-3">Modalidad</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Estado Actual</th>
                    <th className="p-3">Cambiar Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#006899]">{order.id}</div>
                        <div className="text-slate-800 font-semibold">{order.customer.fullName}</div>
                        <div className="text-[10px] text-slate-400">DNI: {order.customer.dni}</div>
                      </td>

                      <td className="p-3">
                        <span className="capitalize font-medium text-slate-700">
                          {order.deliveryMethod === 'pickup'
                            ? `Retiro: ${order.branchId?.toUpperCase()}`
                            : 'Envío a Domicilio'}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-slate-900">
                        {formatCurrencyARS(order.total)}
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-[#006899] uppercase">
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                          className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_preparacion">En Preparación</option>
                          <option value="listo_retiro">Listo Retiro</option>
                          <option value="en_camino">En Camino</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
