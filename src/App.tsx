import React from 'react';
import { 
  StoreBranch, 
  StoreBranchId, 
  Product, 
  ProductCategory, 
  CartItem, 
  Order, 
  AppUserRole, 
  AppUser,
  InboundInvoiceItem 
} from './types';
import { 
  INITIAL_BRANCHES, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS 
} from './data/initialData';
import { 
  getStoredAuthUser, 
  setStoredAuthUser, 
  clearStoredAuthUser 
} from './data/users';
import { 
  apiGetProducts, 
  apiGetBranches, 
  apiGetOrders, 
  apiCreateOrder, 
  apiInboundStock, 
  apiTransferStock, 
  apiAdjustStock, 
  apiUpdateOrderStatus, 
  apiGetMe,
  setAuthToken,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct
} from './api/client';

// Components
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react';

// Code-split heavy admin & utility modals to optimize bundle size
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const BrandbookModal = React.lazy(() =>
  import('./components/BrandbookModal').then((m) => ({ default: m.BrandbookModal }))
);
const PhysicalStoresModal = React.lazy(() =>
  import('./components/PhysicalStoresModal').then((m) => ({ default: m.PhysicalStoresModal }))
);
const BarcodeScannerModal = React.lazy(() =>
  import('./components/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal }))
);

export default function App() {
  // --- Live and Persistent State ---
  const [products, setProducts] = React.useState<Product[]>(INITIAL_PRODUCTS);
  const [branches, setBranches] = React.useState<StoreBranch[]>(INITIAL_BRANCHES);
  const [orders, setOrders] = React.useState<Order[]>(INITIAL_ORDERS);
  const [paymentBanner, setPaymentBanner] = React.useState<{ status: string; orderId: string } | null>(null);
  const [isBackendConnected, setIsBackendConnected] = React.useState<boolean>(false);

  const [cart, setCart] = React.useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mgst_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Sync cart to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('mgst_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage quota exceeded or storage blocked while saving cart', e);
    }
  }, [cart]);

  // Sync data from SQLite backend API
  const refreshData = React.useCallback(async () => {
    try {
      const [prods, brs] = await Promise.all([
        apiGetProducts(),
        apiGetBranches(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      if (brs && brs.length > 0) setBranches(brs);
      setIsBackendConnected(true);

      try {
        const ords = await apiGetOrders();
        if (ords) setOrders(ords);
      } catch {}
    } catch (e) {
      setIsBackendConnected(false);
      console.warn('Backend not ready or running offline mode, using cached data.', e);
    }
  }, []);

  React.useEffect(() => {
    refreshData();
    apiGetMe().then((user) => {
      if (user) {
        setCurrentUser(user);
        setStoredAuthUser(user);
      }
    });

    // Check Mercado Pago redirect query parameters
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status') || params.get('collection_status');
      const orderId = params.get('orderId') || params.get('external_reference');
      if (status && orderId) {
        setPaymentBanner({ status, orderId });
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.error('Error parsing payment URL params', e);
    }
  }, [refreshData]);

  // --- Active Branch and User Session ---
  const [selectedBranchId, setSelectedBranchId] = React.useState<StoreBranchId>('belgrano');
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(() => getStoredAuthUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState<boolean>(false);

  // --- Catalog Filters ---
  const [selectedCategory, setSelectedCategory] = React.useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // --- Modal Visibility States ---
  const [selectedProductForDetail, setSelectedProductForDetail] = React.useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState<boolean>(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = React.useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = React.useState<boolean>(false);
  const [isPhysicalStoresOpen, setIsPhysicalStoresOpen] = React.useState<boolean>(false);
  const [isBrandbookOpen, setIsBrandbookOpen] = React.useState<boolean>(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = React.useState<boolean>(false);

  // Authentication Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setStoredAuthUser(user);
    setCurrentUser(user);
    if (user.branchId) {
      setSelectedBranchId(user.branchId);
    }
    // If staff user logs in, immediately open their dedicated control workspace
    if (user.role === 'admin' || user.role === 'seller') {
      setIsAdminDashboardOpen(true);
    }
    refreshData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    clearStoredAuthUser();
    setCurrentUser(null);
    setIsAdminDashboardOpen(false);
  };

  const handleOpenAdminDashboard = () => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'seller')) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // --- Cart Operations with Inventory Check ---
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const availableStock = product.stockByStore[selectedBranchId] ?? 0;
    const existingInCart = cart.find((i) => i.product.id === product.id)?.quantity || 0;

    if (existingInCart + quantity > availableStock) {
      alert(
        availableStock === 0
          ? `Lo sentimos, este artículo no tiene stock disponible en la sucursal seleccionada (${selectedBranchId.toUpperCase()}).`
          : `No es posible agregar más unidades. Stock disponible en ${selectedBranchId.toUpperCase()}: ${availableStock} un. (ya agregaste ${existingInCart}).`
      );
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const availableStock = prod ? (prod.stockByStore[selectedBranchId] ?? 0) : 0;
    if (newQty > availableStock) {
      alert(`Stock máximo disponible en sucursal: ${availableStock} unidades.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- Order Creation via Server with Atomic Stock Deduction ---
  const handleCreateOrder = async (orderPayload: any): Promise<Order | null> => {
    try {
      const createdOrder = await apiCreateOrder(orderPayload);
      setOrders((prev) => [createdOrder, ...prev]);
      setCart([]);
      await refreshData();
      return createdOrder;
    } catch (err: any) {
      console.error('Order creation error on server:', err);
      throw err;
    }
  };

  // --- Inbound Stock Invoice Processing (Складские накладные) ---
  const handleAddInboundStock = async (item: InboundInvoiceItem) => {
    try {
      await apiInboundStock(item);
      await refreshData();
    } catch (e: any) {
      alert(e.message || 'Error al procesar ingreso de mercadería.');
    }
  };

  // --- Direct Stock Update in Inventory Tab ---
  const handleUpdateProductStock = async (
    productId: string,
    branchId: StoreBranchId,
    newQty: number
  ) => {
    try {
      await apiAdjustStock(productId, branchId, newQty);
      await refreshData();
    } catch (e: any) {
      alert(e.message || 'Error al actualizar stock.');
    }
  };

  // --- Inter-Branch Stock Transfers ---
  const handleTransferStock = async (
    productId: string,
    fromBranch: StoreBranchId,
    toBranch: StoreBranchId,
    qty: number
  ) => {
    try {
      await apiTransferStock(productId, fromBranch, toBranch, qty);
      await refreshData();
    } catch (e: any) {
      alert(e.message || 'Error en la transferencia de stock.');
    }
  };

  // --- Order Status Management ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      await apiUpdateOrderStatus(orderId, newStatus);
      try {
        const ords = await apiGetOrders();
        setOrders(ords);
      } catch {}
    } catch (e: any) {
      alert(e.message || 'Error al actualizar estado del pedido.');
    }
  };

  // --- Product Management (Admin) ---
  const handleCreateProduct = async (productData: any) => {
    try {
      await apiCreateProduct(productData);
      await refreshData();
    } catch (e: any) {
      console.error('Error creating product:', e);
      throw e;
    }
  };

  const handleUpdateProduct = async (id: string, productData: any) => {
    try {
      await apiUpdateProduct(id, productData);
      await refreshData();
    } catch (e: any) {
      console.error('Error updating product:', e);
      throw e;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiDeleteProduct(id);
      await refreshData();
    } catch (e: any) {
      console.error('Error deleting product:', e);
      throw e;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-[#10A4C7] selection:text-white">
      {/* Header with auth menu, branch picker, search, barcode scan, and cart */}
      <Header
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenStores={() => setIsPhysicalStoresOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        isBackendConnected={isBackendConnected}
      />

      {/* Payment Notification Banner (e.g. redirected from Mercado Pago) */}
      {paymentBanner && (
        <aside
          aria-label="Notificación de pago"
          className={`px-4 py-3 text-sm border-b transition-colors ${
            paymentBanner.status === 'success' || paymentBanner.status === 'approved'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : paymentBanner.status === 'pending'
              ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {paymentBanner.status === 'success' || paymentBanner.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : paymentBanner.status === 'pending' ? (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">
                {paymentBanner.status === 'success' || paymentBanner.status === 'approved'
                  ? `¡Pago recibido con éxito! Tu orden #${paymentBanner.orderId} está confirmada y en preparación.`
                  : paymentBanner.status === 'pending'
                  ? `Pago pendiente de acreditación para la orden #${paymentBanner.orderId}. Te notificaremos al confirmarse.`
                  : `El pago no pudo completarse para la orden #${paymentBanner.orderId}. Puedes reintentar desde el checkout.`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsOrderTrackerOpen(true)}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Ver seguimiento
              </button>
              <button
                onClick={() => setPaymentBanner(null)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Cerrar notificación"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Page Content */}
      <main className="flex-1">
        {/* Hero banner shown on main home view */}
        {selectedCategory === 'all' && !searchQuery && (
          <HeroBanner
            onSelectCategory={setSelectedCategory}
            onOpenStores={() => setIsPhysicalStoresOpen(true)}
          />
        )}

        {/* Product Catalog with real-time stock and filter sidebar */}
        <ProductCatalog
          products={products}
          branches={branches}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedBranchId={selectedBranchId}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onSelectProduct={(product) => setSelectedProductForDetail(product)}
          onAddToCart={(product) => handleAddToCart(product)}
        />
      </main>

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        />
      )}

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      {/* Checkout Modal with pickup/delivery selection */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cart}
          branches={branches}
          selectedBranchId={selectedBranchId}
          currentUser={currentUser}
          onCreateOrder={handleCreateOrder}
          onOrderSuccess={() => {}}
        />
      )}

      {/* Order Tracker Modal */}
      {isOrderTrackerOpen && (
        <OrderTrackerModal
          isOpen={isOrderTrackerOpen}
          onClose={() => setIsOrderTrackerOpen(false)}
          orders={orders}
        />
      )}

      {/* Physical Stores Modal */}
      {isPhysicalStoresOpen && (
        <React.Suspense fallback={null}>
          <PhysicalStoresModal
            isOpen={isPhysicalStoresOpen}
            onClose={() => setIsPhysicalStoresOpen(false)}
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
          />
        </React.Suspense>
      )}

      {/* Brandbook & Brand Identity Showcase Modal (Accessible via Admin Dashboard) */}
      {isBrandbookOpen && (
        <React.Suspense fallback={null}>
          <BrandbookModal
            isOpen={isBrandbookOpen}
            onClose={() => setIsBrandbookOpen(false)}
          />
        </React.Suspense>
      )}

      {/* Barcode Scanner Modal */}
      {isBarcodeScannerOpen && (
        <React.Suspense fallback={null}>
          <BarcodeScannerModal
            isOpen={isBarcodeScannerOpen}
            onClose={() => setIsBarcodeScannerOpen(false)}
            products={products}
            selectedBranchId={selectedBranchId}
            onSelectProduct={(product) => setSelectedProductForDetail(product)}
            onAddToCart={(product) => handleAddToCart(product)}
          />
        </React.Suspense>
      )}

      {/* Admin / Seller Dashboard Modal */}
      {isAdminDashboardOpen && (
        <React.Suspense fallback={null}>
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
            currentUser={currentUser}
            products={products}
            branches={branches}
            orders={orders}
            onUpdateProductStock={handleUpdateProductStock}
            onTransferStock={handleTransferStock}
            onAddInboundStock={handleAddInboundStock}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenBrandbookModal={() => setIsBrandbookOpen(true)}
          />
        </React.Suspense>
      )}

      {/* User Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Global Footer */}
      <Footer
        onOpenStores={() => setIsPhysicalStoresOpen(true)}
        onOpenAdmin={handleOpenAdminDashboard}
      />
    </div>
  );
}
