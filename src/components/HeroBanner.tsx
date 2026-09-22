import React from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Store
} from 'lucide-react';
import { ProductCategory } from '../types';
import { BrandLogo } from './BrandLogo';

interface HeroBannerProps {
  onSelectCategory: (category: ProductCategory | 'all') => void;
  onOpenStores: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSelectCategory,
  onOpenStores,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#10A4C7] via-[#006899] to-[#13007C] text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 shadow-xl border border-sky-300/30">
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand Message & Call to Action */}
        <div className="lg:col-span-7 space-y-5">
          {/* Brand Tagline pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#48FEC1] animate-ping"></span>
            <span className="text-[#48FEC1]">SOMOS COMO EL AGUA</span>
            <span className="text-white/80">·</span>
            <span className="text-white">Nos adaptamos a cada cliente</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Tu tecnología en <span className="text-[#48FEC1] underline decoration-[#FFB000]/60 decoration-4 underline-offset-8">Belgrano & Colegiales</span>
          </h1>

          <p className="text-sm sm:text-base text-sky-100 max-w-xl font-normal leading-relaxed">
            Smartphones de última generación con garantía oficial, accesorios premium y 
            servicio técnico especializado en el acto. Retirá gratis en 1 hora en nuestras sucursales o recibí hoy con envío express.
          </p>

          {/* Value props badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs bg-black/20 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-[#48FEC1] flex-shrink-0" />
              <span>3 y 6 Cuotas Sin Interés</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-black/20 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-[#FFB000] flex-shrink-0" />
              <span>Retiro en 1h en Sucursal</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-black/20 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-[#48FEC1] flex-shrink-0" />
              <span>Garantía Oficial Escrita</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectCategory('celulares')}
              className="px-5 py-3 bg-[#48FEC1] hover:bg-[#3ce2ad] text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Ver Celulares en Oferta</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenStores}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold rounded-xl text-sm backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-[#FFB000]" />
              <span>Nuestros Locales</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('servicio_tecnico')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl text-sm backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-[#48FEC1]" />
              <span>Servicio Técnico</span>
            </button>
          </div>
        </div>

        {/* Right Column: Physical Stores & Live Highlights Card */}
        <div className="lg:col-span-5">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Store className="w-5 h-5 text-[#48FEC1]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Nuestras Sucursales</h2>
                  <p className="text-[11px] text-sky-200">Stock en tiempo real en mostrador</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Abierto ahora
              </span>
            </div>

            {/* Store 1: Belgrano */}
            <div className="bg-black/20 hover:bg-black/30 transition-all rounded-xl p-3 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#48FEC1] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Sucursal Belgrano
                </span>
                <span className="text-[10px] text-sky-200 font-mono">Lun a Sáb 10-20hs</span>
              </div>
              <p className="text-xs text-slate-200 font-medium">Av. Cabildo 2995, CABA</p>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                <span>Tel: +54 11 4702-4538</span>
                <span className="text-emerald-300 font-semibold">Pick-up en 1 hora</span>
              </div>
            </div>

            {/* Store 2: Colegiales */}
            <div className="bg-black/20 hover:bg-black/30 transition-all rounded-xl p-3 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#FFB000] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Sucursal Colegiales
                </span>
                <span className="text-[10px] text-sky-200 font-mono">Lun a Sáb 10-19:30hs</span>
              </div>
              <p className="text-xs text-slate-200 font-medium">Av. Elcano 3096, CABA</p>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                <span>Tel: +54 11 4552-5270</span>
                <span className="text-emerald-300 font-semibold">Laboratorio Técnico</span>
              </div>
            </div>

            {/* Technical service banner */}
            <div className="bg-gradient-to-r from-[#10A4C7]/40 to-[#006899]/50 rounded-xl p-3 border border-white/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                <Wrench className="w-5 h-5 text-[#48FEC1]" />
              </div>
              <div className="text-xs leading-tight">
                <div className="font-bold text-white">¿Tenés tu pantalla o batería rota?</div>
                <div className="text-sky-200 text-[11px] mt-0.5">
                  Reparamos tu iPhone, Samsung o Motorola en el acto con repuestos originales.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
