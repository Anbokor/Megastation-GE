import React from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  MapPin, 
  Check, 
  Barcode, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Product, ProductCategory, StoreBranchId, StoreBranch } from '../types';
import { CATEGORIES } from '../data/initialData';
import { ProductCard } from './ProductCard';
import { formatCurrencyARS } from '../utils/formatters';

interface ProductCatalogProps {
  products: Product[];
  branches: StoreBranch[];
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (cat: ProductCategory | 'all') => void;
  selectedBranchId: StoreBranchId;
  searchQuery: string;
  onClearSearch: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  branches,
  selectedCategory,
  onSelectCategory,
  selectedBranchId,
  searchQuery,
  onClearSearch,
  onSelectProduct,
  onAddToCart,
}) => {
  // Filter States
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [onlyInStockInSelectedBranch, setOnlyInStockInSelectedBranch] = React.useState(false);
  const [onlyInStockTotal, setOnlyInStockTotal] = React.useState(false);
  const [maxPrice, setMaxPrice] = React.useState<number>(2000000);
  const [sortBy, setSortBy] = React.useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Derive unique brands from available products
  const availableBrands = React.useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet);
  }, [products]);

  // Toggle brand selection
  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedBrands([]);
    setOnlyInStockInSelectedBranch(false);
    setOnlyInStockTotal(false);
    setMaxPrice(2000000);
    setSortBy('featured');
    onSelectCategory('all');
    onClearSearch();
  };

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // Search query filter (matches name, description, brand, or exact barcode!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const barcodeMatch = product.barcode.toLowerCase().includes(q);
        const nameMatch = product.name.toLowerCase().includes(q);
        const brandMatch = product.brand.toLowerCase().includes(q);
        const descMatch = product.description.toLowerCase().includes(q);
        if (!barcodeMatch && !nameMatch && !brandMatch && !descMatch) {
          return false;
        }
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      // Branch stock filter
      if (onlyInStockInSelectedBranch && (product.stockByStore[selectedBranchId] || 0) <= 0) {
        return false;
      }

      // Global stock filter
      if (onlyInStockTotal) {
        const total = Object.values(product.stockByStore).reduce((a, b) => a + b, 0);
        if (total <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Default: featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [
    products,
    selectedCategory,
    selectedBrands,
    searchQuery,
    maxPrice,
    onlyInStockInSelectedBranch,
    onlyInStockTotal,
    selectedBranchId,
    sortBy,
  ]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const activeCategoryInfo = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header info for Catalog */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeCategoryInfo ? activeCategoryInfo.name : 'Catálogo General'}
            </h2>
            <span className="bg-sky-100 text-[#006899] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} productos
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {activeCategoryInfo
              ? activeCategoryInfo.description
              : 'Descubrí los mejores celulares y accesorios con stock inmediato en Belgrano y Colegiales.'}
          </p>
        </div>

        {/* Search match banner or Sort control */}
        <div className="flex items-center gap-3">
          {searchQuery && (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-900 px-3 py-1.5 rounded-xl text-xs font-medium">
              <Barcode className="w-3.5 h-3.5 text-[#10A4C7]" />
              <span>Búsqueda: <strong>"{searchQuery}"</strong></span>
              <button
                type="button"
                onClick={onClearSearch}
                className="hover:bg-sky-200 rounded-full p-0.5 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sort selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>

          {/* Mobile filters toggle button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#10A4C7]" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Grid with Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
        {/* Desktop Filters Sidebar (and conditional mobile drawer) */}
        <aside
          className={`${
            showMobileFilters ? 'block mb-6' : 'hidden'
          } md:block md:col-span-3 space-y-6 bg-white md:bg-transparent p-5 md:p-0 rounded-2xl border md:border-none border-slate-200 shadow-sm md:shadow-none`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#10A4C7]" />
              Filtros Avanzados
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#006899] hover:underline font-semibold"
            >
              Limpiar todo
            </button>
          </div>

          {/* Branch Availability Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Disponibilidad por Sucursal
            </label>
            <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={onlyInStockInSelectedBranch}
                  onChange={(e) => setOnlyInStockInSelectedBranch(e.target.checked)}
                  className="mt-0.5 rounded text-[#10A4C7] focus:ring-[#10A4C7]"
                />
                <span className="text-slate-700 leading-tight">
                  Solo con stock inmediato en <strong>{activeBranch.shortName}</strong> ({activeBranch.address})
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs pt-1 border-t border-sky-100">
                <input
                  type="checkbox"
                  checked={onlyInStockTotal}
                  onChange={(e) => setOnlyInStockTotal(e.target.checked)}
                  className="mt-0.5 rounded text-[#10A4C7] focus:ring-[#10A4C7]"
                />
                <span className="text-slate-700 leading-tight">
                  En stock en cualquiera de nuestros depósitos
                </span>
              </label>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Marca / Fabricante
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {availableBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleToggleBrand(brand)}
                      className="rounded text-[#10A4C7] focus:ring-[#10A4C7]"
                    />
                    <span className="text-slate-700 font-medium">{brand}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {products.filter((p) => p.brand === brand).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Precio Máximo
              </label>
              <span className="text-xs font-bold text-slate-800">
                {formatCurrencyARS(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={2000000}
              step={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#10A4C7] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$5.000</span>
              <span>$2.000.000</span>
            </div>
          </div>

          {/* Quick Technical Service Promo */}
          <div className="bg-gradient-to-br from-[#006899] to-[#13007C] text-white p-4 rounded-2xl shadow-sm space-y-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#48FEC1]">
              Servicio Técnico Express
            </span>
            <h4 className="font-bold text-xs text-white">¿Tenés tu pantalla o pin roto?</h4>
            <p className="text-[11px] text-sky-100 leading-relaxed">
              Diagnosticamos y cambiamos tu módulo en el acto en Belgrano y Colegiales.
            </p>
            <button
              type="button"
              onClick={() => onSelectCategory('servicio_tecnico')}
              className="w-full mt-2 py-1.5 px-2 bg-[#48FEC1] text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-300 transition-colors"
            >
              Ver Tarifas de Reparación
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="md:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-sky-50 text-[#10A4C7] rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No encontramos productos coincidentes</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Probá cambiando los filtros de marca, aumentando el precio máximo o buscando por otro término o código de barras.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#10A4C7] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#006899] transition-all"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selectedBranchId={selectedBranchId}
                  onSelectProduct={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
