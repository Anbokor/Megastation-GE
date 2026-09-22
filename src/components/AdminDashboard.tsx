import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  ShieldCheck, 
  Store,
  Eye,
  Calendar,
  Truck,
  FileText,
  Filter,
  ChevronDown,
  Sparkles,
  Clock
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
import { formatCurrencyARS, generateArgentineBarcode, formatArgentineDate } from '../utils/formatters';
import { BarcodeVisual } from './BarcodeVisual';
import { apiGetInventoryTransactions, InventoryTransaction } from '../api/client';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  products: Product[];
  branches: StoreBranch[];
  orders: Order[];
  onUpdateProductStock: (productId: string, branchId: StoreBranchId, newQty: number) => Promise<void> | void;
  onTransferStock: (productId: string, fromBranch: StoreBranchId, toBranch: StoreBranchId, qty: number) => Promise<void> | void;
  onAddInboundStock: (item: InboundInvoiceItem & { supplierName?: string; invoiceNumber?: string; note?: string }) => Promise<void> | void;
  onUpdateOrderStatus: (orderId: string, newStatus: any) => Promise<void> | void;
  onCreateProduct?: (productData: any) => Promise<void>;
  onUpdateProduct?: (id: string, productData: any) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
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
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenBrandbookModal,
}) => {
  const isSeller = currentUser?.role === 'seller';
  const isAdmin = currentUser?.role === 'admin';
  const sellerBranchId = (currentUser?.branchId as StoreBranchId) || 'belgrano';
  const sellerBranch = branches.find((b) => b.id === sellerBranchId) || branches[0];

  // Tab navigation
  type AdminTab = 'analytics' | 'orders' | 'catalog' | 'inventory' | 'invoicing' | 'pos_scanner';
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  useEffect(() => {
    if (isSeller) {
      setActiveTab('pos_scanner');
    } else {
      setActiveTab('analytics');
    }
  }, [isSeller, isOpen]);

  // --- Transactions audit history ---
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  const loadTransactions = async () => {
    try {
      setLoadingTx(true);
      const txs = await apiGetInventoryTransactions();
      setTransactions(txs);
    } catch (e) {
      console.error('Error loading inventory transactions', e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'invoicing' || activeTab === 'inventory')) {
      loadTransactions();
    }
  }, [isOpen, activeTab]);

  // --- Create Product Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>(CATEGORIES[0]?.id || 'celulares');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdCost, setNewProdCost] = useState<number>(100000);
  const [newProdMargin, setNewProdMargin] = useState<number>(35);
  const [newProdPrice, setNewProdPrice] = useState<number>(135000);
  const [newProdBarcode, setNewProdBarcode] = useState<string>('');
  const [newProdImage, setNewProdImage] = useState<string>('');
  const [newStockBelgrano, setNewStockBelgrano] = useState<number>(2);
  const [newStockColegiales, setNewStockColegiales] = useState<number>(2);
  const [newStockCentral, setNewStockCentral] = useState<number>(5);
  const [createProdSuccess, setCreateProdSuccess] = useState<string | null>(null);

  // Recalculate suggested selling price when cost or margin changes
  const suggestedSellingPrice = useMemo(() => {
    return Math.round(newProdCost * (1 + newProdMargin / 100));
  }, [newProdCost, newProdMargin]);

  const handleOpenCreateModal = () => {
    setNewProdName('');
    setNewProdBrand('');
    setNewProdCategory(CATEGORIES[0]?.id || 'celulares');
    setNewProdDescription('');
    setNewProdCost(150000);
    setNewProdMargin(35);
    setNewProdPrice(Math.round(150000 * 1.35));
    setNewProdBarcode(generateArgentineBarcode());
    setNewProdImage('https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80');
    setNewStockBelgrano(2);
    setNewStockColegiales(2);
    setNewStockCentral(5);
    setCreateProdSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateProduct) return;
    try {
      await onCreateProduct({
        name: newProdName,
        brand: newProdBrand,
        category: newProdCategory,
        description: newProdDescription || `${newProdBrand} ${newProdName}`,
        price: newProdPrice || suggestedSellingPrice,
        costPrice: newProdCost,
        marginPercent: newProdMargin,
        image: newProdImage || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
        barcode: newProdBarcode || generateArgentineBarcode(),
        stockByStore: {
          belgrano: newStockBelgrano,
          colegiales: newStockColegiales,
          central: newStockCentral,
        },
      });
      setCreateProdSuccess(`¡Producto "${newProdName}" creado con éxito en la base de datos!`);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateProdSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error al crear producto.');
    }
  };

  // --- Edit Product Modal State ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editImage, setEditImage] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.price);
    setEditCostPrice(p.costPrice || Math.round(p.price * 0.7));
    setEditImage(p.image);
    setEditDescription(p.description);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !onUpdateProduct) return;
    try {
      await onUpdateProduct(editingProduct.id, {
        price: editPrice,
        costPrice: editCostPrice,
        image: editImage,
        description: editDescription,
      });
      setEditingProduct(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar producto.');
    }
  };

  const handleDeleteProd = async (id: string, name: string) => {
    if (!onDeleteProduct) return;
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${name}" del catálogo y la base de datos?`)) {
      try {
        await onDeleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'Error al eliminar producto.');
      }
    }
  };

  // --- Inbound Remito / Procurement State ---
  const [supplierName, setSupplierName] = useState('ASUS Latam / Distridata');
  const [invoiceNumber, setInvoiceNumber] = useState('REM-2026-0042');
  const [selectedInboundProdId, setSelectedInboundProdId] = useState<string>(products[0]?.id || '');
  const [inboundCost, setInboundCost] = useState<number>(products[0]?.costPrice || 50000);
  const [inboundMargin, setInboundMargin] = useState<number>(35);
  const [inboundSellingPrice, setInboundSellingPrice] = useState<number>(0);
  const [inboundQty, setInboundQty] = useState<number>(10);
  const [inboundTargetBranch, setInboundTargetBranch] = useState<StoreBranchId>('central');
  const [inboundSuccessMsg, setInboundSuccessMsg] = useState<string | null>(null);

  const calculatedSuggestedInboundPrice = useMemo(() => {
    return Math.round(inboundCost * (1 + inboundMargin / 100));
  }, [inboundCost, inboundMargin]);

  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPriceToSave = inboundSellingPrice || calculatedSuggestedInboundPrice;
    const found = products.find((p) => p.id === selectedInboundProdId) || products[0];
    try {
      await onAddInboundStock({
        id: `inb-${Date.now()}`,
        productId: selectedInboundProdId,
        productName: found ? found.name : 'Producto',
        category: found ? found.category : 'celulares',
        barcode: found ? found.barcode : '',
        quantity: inboundQty,
        costPrice: inboundCost,
        desiredMarginPercent: inboundMargin,
        suggestedPrice: calculatedSuggestedInboundPrice,
        finalPrice: finalPriceToSave,
        targetBranch: inboundTargetBranch,
        supplierName,
        invoiceNumber,
        note: `Factura ${invoiceNumber} de ${supplierName}`,
      });
      setInboundSuccessMsg(
        `✅ Remito ${invoiceNumber} procesado exitosamente: +${inboundQty} unidades ingresadas a ${inboundTargetBranch.toUpperCase()}.`
      );
      loadTransactions();
      setTimeout(() => setInboundSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al procesar remito');
    }
  };

  // --- Inter-Branch Transfer State ---
  const [transferProdId, setTransferProdId] = useState<string>(products[0]?.id || '');
  const [transferFrom, setTransferFrom] = useState<StoreBranchId>('central');
  const [transferTo, setTransferTo] = useState<StoreBranchId>('belgrano');
  const [transferQty, setTransferQty] = useState<number>(2);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  const handleProcessTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onTransferStock(transferProdId, transferFrom, transferTo, transferQty);
      setTransferSuccessMsg(`✅ Transferencia de ${transferQty} unidades a ${transferTo.toUpperCase()} realizada con éxito.`);
      loadTransactions();
      setTimeout(() => setTransferSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al procesar transferencia.');
    }
  };

  // --- Orders Tab Filter & Detail State ---
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderBranchFilter, setOrderBranchFilter] = useState<string>(isSeller ? sellerBranchId : 'all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (isSeller && o.branchId !== sellerBranchId) {
        return false;
      }
      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) {
        return false;
      }
      if (!isSeller && orderBranchFilter !== 'all' && o.branchId !== orderBranchFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q) || o.trackingNumber.toLowerCase().includes(q);
        const matchesName = o.customer.fullName.toLowerCase().includes(q);
        const matchesDni = o.customer.dni.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesDni) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderBranchFilter, orderSearch, isSeller, sellerBranchId]);

  // --- Inventory Search & Low Stock State ---
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('all');

  const filteredInventoryProducts = useMemo(() => {
    return products.filter((p) => {
      if (inventoryCategory !== 'all' && p.category !== inventoryCategory) {
        return false;
      }
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.includes(q);
        if (!matchesName && !matchesBrand && !matchesBarcode) return false;
      }
      return true;
    });
  }, [products, inventorySearch, inventoryCategory]);

  // Inventory valuation metrics (Admin only)
  const inventoryMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const pTotal = (p.stockByStore?.belgrano || 0) + (p.stockByStore?.colegiales || 0) + (p.stockByStore?.central || 0);
      totalUnits += pTotal;
      totalRetailValue += pTotal * p.price;
      totalCostValue += pTotal * (p.costPrice || Math.round(p.price * 0.7));
      if (pTotal < 4) {
        lowStockCount++;
      }
    }

    return { totalUnits, totalRetailValue, totalCostValue, lowStockCount };
  }, [products]);

  // Revenue metrics from orders
  const revenueMetrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.orderStatus !== 'cancelado');
    const grossRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const completedOrders = validOrders.filter((o) => o.orderStatus === 'entregado').length;
    const avgTicket = validOrders.length > 0 ? Math.round(grossRevenue / validOrders.length) : 0;
    return { grossRevenue, totalOrders: validOrders.length, completedOrders, avgTicket };
  }, [orders]);

  // --- POS Scanner State ---
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    setScannedBarcode(clean);
    const found = products.find((p) => p.barcode === clean || p.id.toLowerCase() === clean.toLowerCase());
    setScannedProduct(found || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[94vh] flex flex-col my-auto">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#10A4C7] to-[#006899] flex items-center justify-center text-white font-extrabold shadow-md">
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isAdmin ? 'Panel de Control General (Enterprise Admin)' : `Terminal de Punto de Venta (POS) · ${sellerBranch.name}`}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-[#10A4C7]/20 text-[#48FEC1] border border-[#10A4C7]/30'
                }`}>
                  {isAdmin ? 'Nivel: Administrador' : `Sucursal: ${sellerBranch.shortName}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAdmin 
                  ? 'Gestión omnicanal centralizada: ventas, catálogo, compras a proveedores y stock multi-sucursal.'
                  : `Operador asignado: ${currentUser?.name || 'Vendedor'} | Despacho y facturación en mostrador`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenBrandbookModal && (
              <button
                type="button"
                onClick={onOpenBrandbookModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#48FEC1]" />
                <span>Brandbook</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Cerrar panel de administración"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-4 overflow-x-auto">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'analytics'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#10A4C7]" />
                <span>Métricas & Finanzas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'orders'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-[#006899]" />
                <span>Gestión de Pedidos ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'catalog'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Catálogo & Productos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'inventory'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-4 h-4 text-amber-600" />
                <span>Stock Multi-Sucursal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invoicing')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'invoicing'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Compras & Remitos (Proveedores)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pos_scanner')}
                className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'pos_scanner'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Scan className="w-4 h-4 text-[#10A4C7]" />
                <span>Terminal POS</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('pos_scanner')}
                className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'pos_scanner'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Scan className="w-4 h-4 text-[#10A4C7]" />
                <span>Terminal POS & Lector de Códigos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'orders'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-[#006899]" />
                <span>Órdenes de mi Sucursal ({filteredOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`py-3.5 px-5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'inventory'
                    ? 'border-[#006899] text-[#006899] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Stock Local & Transferencias</span>
              </button>
            </>
          )}
        </div>

        {/* Tab 1: Metrics & Financial Analytics (Admin only) */}
        {activeTab === 'analytics' && isAdmin && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Facturación Total
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrencyARS(revenueMetrics.grossRevenue)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {revenueMetrics.totalOrders} pedidos totales registrados
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#10A4C7]" />
                  Ticket Promedio
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrencyARS(revenueMetrics.avgTicket)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {revenueMetrics.completedOrders} entregados satisfactoriamente
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-600" />
                  Valuación Inventario (Venta)
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrencyARS(inventoryMetrics.totalRetailValue)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Costo: {formatCurrencyARS(inventoryMetrics.totalCostValue)}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Alertas de Stock
                </span>
                <div className="text-2xl font-black text-rose-600">
                  {inventoryMetrics.lowStockCount} artículos
                </div>
                <div className="text-[10px] text-rose-500 font-semibold">
                  Menos de 4 unidades disponibles en red
                </div>
              </div>
            </div>

            {/* Quick stock distribution overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#006899]" />
                Distribución de Stock Físico por Sucursal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map((b) => {
                  const branchUnits = products.reduce((sum, p) => sum + (p.stockByStore?.[b.id] || 0), 0);
                  return (
                    <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-400">{b.address}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#006899]">{branchUnits}</span>
                        <span className="text-xs text-slate-500 ml-1">un.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders Management (Admin & Seller) */}
        {activeTab === 'orders' && (
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Estado:
                </span>
                {['all', 'pendiente', 'en_preparacion', 'listo_retiro', 'en_camino', 'entregado', 'cancelado'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#006899] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {!isSeller && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Sucursal:</span>
                  <select
                    value={orderBranchFilter}
                    onChange={(e) => setOrderBranchFilter(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="all">Todas las sucursales</option>
                    <option value="belgrano">Belgrano (Cabildo)</option>
                    <option value="colegiales">Colegiales (Lacroze)</option>
                    <option value="central">Depósito Central</option>
                  </select>
                </div>
              )}

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar N° orden, cliente o DNI..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">N° Orden / Tracking</th>
                    <th className="p-3">Cliente & Contacto</th>
                    <th className="p-3">Entrega / Retiro</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No se encontraron pedidos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#006899]">{order.id}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3 text-[#10A4C7]" />
                            {order.trackingNumber}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1">
                            {formatArgentineDate(order.createdAt)}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900">{order.customer.fullName}</div>
                          <div className="text-[10px] text-slate-500">DNI: {order.customer.dni} · Tel: {order.customer.phone}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{order.customer.email}</div>
                        </td>

                        <td className="p-3">
                          <span className="font-medium text-slate-800 block">
                            {order.deliveryMethod === 'pickup'
                              ? `🏪 Retiro: ${order.branchId?.toUpperCase()}`
                              : '🚚 Envío a Domicilio'}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            Pago: {order.paymentMethod} ({order.paymentStatus})
                          </span>
                        </td>

                        <td className="p-3 font-black text-slate-900 text-sm">
                          {formatCurrencyARS(order.total)}
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              order.orderStatus === 'entregado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.orderStatus === 'listo_retiro'
                                ? 'bg-sky-100 text-sky-800'
                                : order.orderStatus === 'en_preparacion'
                                ? 'bg-amber-100 text-amber-800'
                                : order.orderStatus === 'cancelado'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {order.orderStatus.replace('_', ' ')}
                            </span>
                            {order.hasBackorder && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Bajo Pedido</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                          <select
                            value={order.orderStatus}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                            className="text-xs p-1 bg-white border border-slate-300 rounded-lg font-bold"
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Catalog & Product Creation (Admin only) */}
        {activeTab === 'catalog' && isAdmin && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Gestión de Catálogo de Productos ({products.length} artículos)
                </h3>
                <p className="text-xs text-slate-500">
                  Podés dar de alta nuevos productos, modificar precios de venta/costo o eliminar artículos del catálogo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#006899] hover:to-[#13007C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Producto</span>
              </button>
            </div>

            {/* Product Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Costo</th>
                    <th className="p-3 text-right">Margen</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    <th className="p-3 text-center">Stock Total</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {products.map((p) => {
                    const totalSt = (p.stockByStore?.belgrano || 0) + (p.stockByStore?.colegiales || 0) + (p.stockByStore?.central || 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-contain p-1 border border-slate-200 rounded-lg bg-white shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <span className="font-semibold text-slate-600">{p.brand}</span> · {p.barcode}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {p.category}
                          </span>
                        </td>

                        <td className="p-3 text-right text-slate-500 font-mono">
                          {formatCurrencyARS(p.costPrice || Math.round(p.price * 0.7))}
                        </td>

                        <td className="p-3 text-right font-bold text-emerald-600">
                          {p.marginPercent || 35}%
                        </td>

                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {formatCurrencyARS(p.price)}
                        </td>

                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            totalSt < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {totalSt} un.
                          </span>
                        </td>

                        <td className="p-3 text-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#006899] rounded-lg transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProd(p.id, p.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Multi-Store Inventory & Transfers (Admin & Seller) */}
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
                        {p.name.slice(0, 35)}...
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
                    className="w-full py-2 px-3 bg-[#006899] hover:bg-[#10A4C7] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Transferir {transferQty} un.
                  </button>
                </div>
              </form>
            </div>

            {/* Inventory table */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Stock Detallado por Sucursal ({filteredInventoryProducts.length} productos)
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="all">Todas las categorías</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Producto / EAN</th>
                      <th className="p-3 text-center">Belgrano (Cabildo)</th>
                      <th className="p-3 text-center">Colegiales (Lacroze)</th>
                      <th className="p-3 text-center">Depósito Central</th>
                      <th className="p-3 text-right">Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredInventoryProducts.map((p) => (
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
                          {isAdmin || sellerBranchId === 'belgrano' ? (
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore?.belgrano ?? 0}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'belgrano', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-700">{p.stockByStore?.belgrano ?? 0} un.</span>
                          )}
                        </td>

                        {/* Stock Colegiales */}
                        <td className="p-3 text-center">
                          {isAdmin || sellerBranchId === 'colegiales' ? (
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore?.colegiales ?? 0}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'colegiales', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-700">{p.stockByStore?.colegiales ?? 0} un.</span>
                          )}
                        </td>

                        {/* Stock Central */}
                        <td className="p-3 text-center">
                          {isAdmin ? (
                            <input
                              type="number"
                              min={0}
                              value={p.stockByStore?.central ?? 0}
                              onChange={(e) =>
                                onUpdateProductStock(p.id, 'central', Number(e.target.value))
                              }
                              className="w-14 text-center p-1 bg-slate-50 border border-slate-200 rounded font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-700">{p.stockByStore?.central ?? 0} un.</span>
                          )}
                        </td>

                        <td className="p-3 text-right font-black text-slate-900">
                          {formatCurrencyARS(p.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Supplier Invoices & Procurement (Admin only) */}
        {activeTab === 'invoicing' && isAdmin && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#10A4C7]" />
                Registrar Remito de Compra a Proveedor
              </h3>

              {inboundSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  {inboundSuccessMsg}
                </div>
              )}

              <form onSubmit={handleInboundSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      1. Proveedor / Distribuidor
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Ej: ASUS Latam / Distridata"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      2. N° de Remito / Factura
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Ej: REM-0001-0004921"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      3. Producto a Ingresar
                    </label>
                    <select
                      value={selectedInboundProdId}
                      onChange={(e) => {
                        setSelectedInboundProdId(e.target.value);
                        const found = products.find((p) => p.id === e.target.value);
                        if (found) {
                          setInboundCost(found.costPrice || Math.round(found.price * 0.7));
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      4. Costo Unitario de Compra ($ ARS)
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={inboundCost}
                      onChange={(e) => setInboundCost(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      5. Margen Deseado (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={inboundMargin}
                      onChange={(e) => setInboundMargin(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      6. Precio Venta Sugerido ($ ARS)
                    </label>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-800">
                      {formatCurrencyARS(calculatedSuggestedInboundPrice)}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      7. Cantidad de Unidades Ingresadas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={inboundQty}
                      onChange={(e) => setInboundQty(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      8. Sucursal de Descarga
                    </label>
                    <select
                      value={inboundTargetBranch}
                      onChange={(e) => setInboundTargetBranch(e.target.value as StoreBranchId)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.address})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#10A4C7] hover:bg-[#006899] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Confirmar Ingreso & Actualizar Stock</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Audit log of recent transactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#006899]" />
                  Historial de Movimientos & Remitos Recientes
                </h4>
                <button
                  type="button"
                  onClick={loadTransactions}
                  className="text-xs text-[#006899] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingTx ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Cantidad</th>
                      <th className="p-3">Destino / Origen</th>
                      <th className="p-3">Detalle / Proveedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {loadingTx ? 'Cargando transacciones...' : 'No hay movimientos registrados en el sistema.'}
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 20).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 text-[11px] font-mono">
                            {formatArgentineDate(t.createdAt)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.type === 'inbound'
                                ? 'bg-purple-100 text-purple-800'
                                : t.type === 'transfer'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{t.productName}</td>
                          <td className="p-3 text-center font-black text-slate-900">{t.quantity} un.</td>
                          <td className="p-3 text-slate-700 font-semibold uppercase">
                            {t.toBranch || t.fromBranch || '-'}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{t.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: POS Barcode Scanner (Admin & Seller) */}
        {activeTab === 'pos_scanner' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[#48FEC1]" />
                  <h3 className="font-extrabold text-sm text-white">
                    Pistola Lectora de Códigos de Barra (Punto de Venta POS)
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
                  className="px-4 py-3 bg-[#48FEC1] text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  Probar Demo
                </button>
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
                        {scannedProduct.brand} · {scannedProduct.category}
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
                  <div className={`p-3 rounded-xl border text-center ${sellerBranchId === 'belgrano' ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400' : 'bg-white border-emerald-200'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Sucursal Belgrano</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {scannedProduct.stockByStore.belgrano} un.
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${sellerBranchId === 'colegiales' ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400' : 'bg-white border-emerald-200'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Sucursal Colegiales</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {scannedProduct.stockByStore.colegiales} un.
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Depósito Central</span>
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

        {/* Modal: Create Product */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#48FEC1]" />
                  Crear Nuevo Producto en Catálogo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createProdSuccess ? (
                <div className="p-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <div className="text-emerald-800 font-extrabold text-sm">{createProdSuccess}</div>
                </div>
              ) : (
                <form onSubmit={handleSaveNewProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nombre del Producto</label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Ej: Placa de Video GeForce RTX 5080 16GB Gaming OC"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Marca</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        placeholder="Ej: Gigabyte, ASUS, Corsair"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Categoría</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Costo de Compra ($ ARS)</label>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Margen Deseado (%)</label>
                      <input
                        type="number"
                        min={5}
                        max={200}
                        value={newProdMargin}
                        onChange={(e) => setNewProdMargin(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                        Precio de Venta Final al Público ($ ARS)
                      </label>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-[#006899] rounded-xl text-sm font-black text-slate-900"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Sugerido con margen de {newProdMargin}%: {formatCurrencyARS(suggestedSellingPrice)}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Código de Barras EAN-13</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newProdBarcode}
                          onChange={(e) => setNewProdBarcode(e.target.value)}
                          className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setNewProdBarcode(generateArgentineBarcode())}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Generar Nuevo
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">URL de Imagen</label>
                      <input
                        type="url"
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>

                    {/* Initial stocks */}
                    <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase block">
                        Stock Inicial por Sucursal
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Belgrano</label>
                          <input
                            type="number"
                            min={0}
                            value={newStockBelgrano}
                            onChange={(e) => setNewStockBelgrano(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Colegiales</label>
                          <input
                            type="number"
                            min={0}
                            value={newStockColegiales}
                            onChange={(e) => setNewStockColegiales(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Central</label>
                          <input
                            type="number"
                            min={0}
                            value={newStockCentral}
                            onChange={(e) => setNewStockCentral(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-[#10A4C7] to-[#006899] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Guardar en Base de Datos
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Edit Product */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#48FEC1]" />
                  Editar Producto: {editingProduct.name.slice(0, 30)}...
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditProduct} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Precio de Venta ($ ARS)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Costo de Compra ($ ARS)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">URL de Imagen</label>
                  <input
                    type="url"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#006899] hover:bg-[#10A4C7] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Order Items & Customer Detail */}
        {selectedOrderForDetail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#48FEC1]" />
                    Detalle del Pedido #{selectedOrderForDetail.id}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Tracking: {selectedOrderForDetail.trackingNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{selectedOrderForDetail.customer.fullName}</div>
                  <div className="text-slate-500">DNI: {selectedOrderForDetail.customer.dni} · Tel: {selectedOrderForDetail.customer.phone}</div>
                  <div className="text-slate-500">Email: {selectedOrderForDetail.customer.email}</div>
                  {selectedOrderForDetail.customer.address && (
                    <div className="text-slate-700 font-medium pt-1 border-t border-slate-200 mt-1">
                      Dirección de entrega: {selectedOrderForDetail.customer.address.street} {selectedOrderForDetail.customer.address.number}, {selectedOrderForDetail.customer.address.city}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Artículos en el pedido:
                  </span>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {selectedOrderForDetail.items.map((it, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{it.productName}</span>
                            {it.isBackorder && (
                              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Bajo Pedido</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{it.brand} · {it.barcode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatCurrencyARS(it.price)} x {it.quantity} un.</div>
                          <div className="font-black text-[#006899]">{formatCurrencyARS(it.price * it.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Total a Cobrar:</span>
                  <span className="font-black text-slate-900 text-base">
                    {formatCurrencyARS(selectedOrderForDetail.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
