import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  MapPin, 
  Barcode, 
  Package, 
  ShieldCheck, 
  Sparkles,
  User,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Store,
  UserCheck,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { StoreBranch, StoreBranchId, AppUser, ProductCategory } from '../types';
import { CATEGORIES } from '../data/initialData';
import { formatCurrencyARS } from '../utils/formatters';

interface HeaderProps {
  branches: StoreBranch[];
  selectedBranchId: StoreBranchId;
  onSelectBranch: (id: StoreBranchId) => void;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAdminDashboard: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (category: ProductCategory | 'all') => void;
  onOpenOrderTracker: () => void;
  onOpenStores: () => void;
  onOpenBarcodeScanner: () => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenAdminDashboard,
  cartCount,
  cartTotal,
  onOpenCart,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenOrderTracker,
  onOpenStores,
  onOpenBarcodeScanner,
  isBackendConnected = false,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      {/* Top micro-bar: announcements, physical branch info, and staff bar */}
      <div className="bg-gradient-to-r from-[#10A4C7] via-[#006899] to-[#13007C] text-white text-xs px-4 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Slogan and delivery badge */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white">
              <Sparkles className="w-3 h-3 text-[#48FEC1]" />
              Somos como el agua
            </span>
            <span className="truncate">
              ⚡ <strong>3 y 6 Cuotas Sin Interés</strong> | Retiro Gratis en 1h en <strong>Belgrano</strong> y <strong>Colegiales</strong>
            </span>
          </div>

          {/* Right side: Branch switcher & Staff quick status */}
          <div className="flex items-center gap-2.5 ml-auto text-[11px]">
            {/* Live SQLite DB status badge - ONLY visible to staff (Admin or Seller) */}
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'seller') && (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight border ${
                  isBackendConnected
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/50 shadow-xs'
                    : 'bg-amber-950/80 text-amber-300 border-amber-400/50'
                }`}
                title={
                  isBackendConnected
                    ? 'Conectado al servidor Express y base de datos relacional SQLite (Drizzle ORM en modo WAL)'
                    : 'Modo sin conexión - usando catálogo en caché'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                ></span>
                <span>{isBackendConnected ? 'SQLite Live' : 'Offline'}</span>
              </span>
            )}

            {/* Branch selector */}
            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
              <MapPin className="w-3 h-3 text-[#48FEC1]" />
              <span className="text-slate-200 hidden md:inline">Retiro en:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value as StoreBranchId)}
                className="bg-transparent text-white font-semibold cursor-pointer focus:outline-none pr-1"
                aria-label="Seleccionar sucursal de retiro"
              >
                {branches
                  .filter((b) => b.type === 'store')
                  .map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                      {b.shortName} ({b.address})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick staff dashboard shortcut if logged in as Admin or Seller */}
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'seller') && (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white text-slate-900 font-bold hover:bg-sky-50 transition-all shadow-xs cursor-pointer"
                title={currentUser.role === 'admin' ? 'Abrir Panel de Administración General' : 'Abrir Terminal POS'}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>Panel Admin</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3 text-[#006899]" />
                    <span>Terminal POS</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-5">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="flex-shrink-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADEF] rounded-xl group flex items-center py-0.5 transition-transform active:scale-[0.98]"
            title="Megastation Shop - Inicio"
            aria-label="Ir a inicio de Megastation Shop"
          >
            <BrandLogo size="lg" layout="horizontal" showSlogan={false} />
          </button>

          {/* Search bar with instant barcode scanner trigger */}
          <div className="flex-1 max-w-xl mx-2 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar placas de video, procesadores, periféricos o código de barras (EAN-13)..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-[#10A4C7] focus:ring-2 focus:ring-[#10A4C7]/20 rounded-xl text-sm transition-all placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                title="Escanear o ingresar código de barras"
                className="absolute right-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#006899] rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <Barcode className="w-4 h-4 text-[#10A4C7]" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Physical stores popup trigger */}
            <button
              type="button"
              onClick={onOpenStores}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006899] hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#10A4C7]" />
              <span>Locales</span>
            </button>

            {/* Orders tracking */}
            <button
              type="button"
              onClick={onOpenOrderTracker}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006899] hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 cursor-pointer"
              title="Seguimiento de pedidos"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>Mis Pedidos</span>
            </button>

            {/* Auth / Account Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              {currentUser ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-[#10A4C7] bg-slate-50 hover:bg-sky-50/50 transition-all text-left cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-500'
                        : currentUser.role === 'seller'
                        ? 'bg-[#006899]'
                        : 'bg-emerald-600'
                    }`}>
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col leading-tight">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium capitalize">
                        {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'seller' ? 'Ventas' : 'Cliente'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                      {/* User Info header */}
                      <div className="p-3 border-b border-slate-100 bg-slate-50/80 rounded-xl mb-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.name}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                            currentUser.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : currentUser.role === 'seller'
                              ? 'bg-sky-100 text-[#006899]'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {currentUser.email}
                        </span>
                      </div>

                      {/* Role-specific options */}
                      {(currentUser.role === 'admin' || currentUser.role === 'seller') && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdminDashboard();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-[#006899] hover:bg-sky-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-[#10A4C7]" />
                          <span>
                            {currentUser.role === 'admin' ? 'Panel de Administración' : 'Terminal POS & Stock'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrderTracker();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>Mis Pedidos & Envíos</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006899] hover:bg-sky-50 rounded-xl transition-all border border-slate-200/80 cursor-pointer"
                  title="Iniciar sesión o registrarse"
                >
                  <User className="w-4 h-4 text-[#10A4C7]" />
                  <span>Ingresar</span>
                </button>
              )}
            </div>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#0e95b5] hover:to-[#005a85] text-white px-3.5 py-2 rounded-xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#FFB000] text-slate-950 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[10px] text-sky-100 font-medium uppercase tracking-wider">Carrito</span>
                <span className="text-xs font-bold text-white">
                  {cartCount > 0 ? formatCurrencyARS(cartTotal) : '$0'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 mt-2 border-t border-slate-100 no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#006899] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span>Todos los productos</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#10A4C7] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
