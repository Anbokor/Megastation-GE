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

// Components
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { PhysicalStoresModal } from './components/PhysicalStoresModal';
import { BrandbookModal } from './components/BrandbookModal';
import { LogoManagerModal } from './components/LogoManagerModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';

export default function App() {
  // --- Persistent State or Memory State ---
  const [products, setProducts] = React.useState<Product[]>(() => {
    const saved = localStorage.getItem('mgst_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [branches] = React.useState<StoreBranch[]>(INITIAL_BRANCHES);

  const [orders, setOrders] = React.useState<Order[]>(() => {
    const saved = localStorage.getItem('mgst_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_ORDERS;
  });

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

  // Save products and orders to localStorage safely
  React.useEffect(() => {
    try {
      localStorage.setItem('mgst_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage quota exceeded or storage blocked while saving products', e);
    }
  }, [products]);

  React.useEffect(() => {
    try {
      localStorage.setItem('mgst_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage quota exceeded or storage blocked while saving orders', e);
    }
  }, [orders]);

  React.useEffect(() => {
    try {
      localStorage.setItem('mgst_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage quota exceeded or storage blocked while saving cart', e);
    }
  }, [cart]);

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
  const [isLogoManagerOpen, setIsLogoManagerOpen] = React.useState<boolean>(false);
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
  };

  const handleLogout = () => {
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

  // --- Cart Operations ---
  const handleAddToCart = (product: Product, quantity: number = 1) => {
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
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- Order Creation & Stock Deductions ---
  const handleCreateOrder = (newOrder: Order) => {
    // 1. Add order to state
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Decrement stock from the chosen branch if pickup, or central if delivery
    const targetBranch: StoreBranchId =
      newOrder.deliveryMethod === 'pickup' && newOrder.branchId
        ? newOrder.branchId
        : 'central';

    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const orderItem = newOrder.items.find((i) => i.productId === prod.id);
        if (orderItem) {
          const currentStock = prod.stockByStore[targetBranch] || 0;
          const updatedStock = Math.max(0, currentStock - orderItem.quantity);
          return {
            ...prod,
            stockByStore: {
              ...prod.stockByStore,
              [targetBranch]: updatedStock,
            },
          };
        }
        return prod;
      })
    );

    // 3. Clear cart
    setCart([]);
  };

  // --- Inbound Stock Invoice Processing (Складские накладные) ---
  const handleAddInboundStock = (item: InboundInvoiceItem) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === item.productId) {
          const currentBranchStock = p.stockByStore[item.targetBranch] || 0;
          return {
            ...p,
            price: item.finalPrice,
            costPrice: item.costPrice,
            stockByStore: {
              ...p.stockByStore,
              [item.targetBranch]: currentBranchStock + item.quantity,
            },
          };
        }
        return p;
      })
    );
  };

  // --- Direct Stock Update in Inventory Tab ---
  const handleUpdateProductStock = (
    productId: string,
    branchId: StoreBranchId,
    newQty: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockByStore: {
              ...p.stockByStore,
              [branchId]: Math.max(0, newQty),
            },
          };
        }
        return p;
      })
    );
  };

  // --- Inter-Branch Stock Transfers ---
  const handleTransferStock = (
    productId: string,
    fromBranch: StoreBranchId,
    toBranch: StoreBranchId,
    qty: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const fromQty = p.stockByStore[fromBranch] || 0;
          const toQty = p.stockByStore[toBranch] || 0;
          const actualTransfer = Math.min(fromQty, qty);

          return {
            ...p,
            stockByStore: {
              ...p.stockByStore,
              [fromBranch]: fromQty - actualTransfer,
              [toBranch]: toQty + actualTransfer,
            },
          };
        }
        return p;
      })
    );
  };

  // --- Order Status Management ---
  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            statusHistory: [
              ...o.statusHistory,
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: `Estado modificado desde el panel de control a: ${newStatus.toUpperCase()}`,
              },
            ],
          };
        }
        return o;
      })
    );
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
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
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
      />

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
        <PhysicalStoresModal
          isOpen={isPhysicalStoresOpen}
          onClose={() => setIsPhysicalStoresOpen(false)}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
        />
      )}

      {/* Brandbook & Brand Identity Showcase Modal (Accessible via Admin Dashboard) */}
      {isBrandbookOpen && (
        <BrandbookModal
          isOpen={isBrandbookOpen}
          onClose={() => setIsBrandbookOpen(false)}
        />
      )}

      {/* Dedicated Logo Manager Modal */}
      {isLogoManagerOpen && (
        <LogoManagerModal
          isOpen={isLogoManagerOpen}
          onClose={() => setIsLogoManagerOpen(false)}
        />
      )}

      {/* Barcode Scanner Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          products={products}
          selectedBranchId={selectedBranchId}
          onSelectProduct={(product) => setSelectedProductForDetail(product)}
          onAddToCart={(product) => handleAddToCart(product)}
        />
      )}

      {/* Admin / Seller Dashboard Modal */}
      {isAdminDashboardOpen && (
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
          onOpenBrandbookModal={() => setIsBrandbookOpen(true)}
        />
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
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
      />
    </div>
  );
}
