import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  CreditCard,
  Building2,
  Wrench
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onOpenStores: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenStores,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1 & 2: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" variant="color" showSlogan={false} />

            <p className="text-xs text-slate-300 max-w-sm leading-relaxed mt-3">
              Líderes en telefonía celular, servicio técnico especializado y accesorios de vanguardia.
              Atención presencial en nuestros locales a la calle en Belgrano y Colegiales, y envíos a todo el país.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <span className="bg-slate-800 text-sky-300 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                Garantía Oficial Escrita
              </span>
              <span className="bg-slate-800 text-[#48FEC1] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                Pick-up en 1 Hora
              </span>
              <span className="bg-slate-800 text-[#FFB000] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                Venta Minorista & Mayorista
              </span>
            </div>
          </div>

          {/* Col 3: Sucursales Físicas */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#10A4C7]" />
              Locales a la Calle
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-200">Sucursal Belgrano</div>
                <div className="text-slate-400">Av. Cabildo 2995, CABA</div>
                <div className="text-[11px] text-slate-500 font-mono">Lun a Sáb 10-20hs</div>
                <div className="text-[11px] text-sky-400">Tel: +54 11 4702-4538</div>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-slate-800">
                <div className="font-bold text-slate-200">Sucursal Colegiales</div>
                <div className="text-slate-400">Av. Elcano 3096, CABA</div>
                <div className="text-[11px] text-slate-500 font-mono">Lun a Sáb 10-19:30hs</div>
                <div className="text-[11px] text-sky-400">Tel: +54 11 4552-5270</div>
              </div>
            </div>
          </div>

          {/* Col 4: Servicio Técnico y Soporte */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#48FEC1]" />
              Servicio Técnico
            </h3>

            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Cambio de módulos y pantallas
                </span>
              </li>
              <li>
                <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Reemplazo de baterías en el acto
                </span>
              </li>
              <li>
                <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Microelectrónica y pines de carga
                </span>
              </li>
              <li>
                <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Presupuestos sin cargo
                </span>
              </li>
              <li className="pt-1">
                <span className="text-[#48FEC1] text-[11px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Reparaciones con 90 días de garantía
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Medios de Pago y Administración */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#FFB000]" />
              Formas de Pago
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Aceptamos Mercado Pago, tarjetas de crédito (hasta 6 cuotas sin interés), débito, transferencias inmediatas con 10% OFF y efectivo en mostrador.
            </p>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Acceso Administración & POS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright and legal notices */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} MEGASTATION SHOP. Todos los derechos reservados. CUIT 30-71654321-8.
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={onOpenStores} className="hover:text-slate-300">
              Locales Belgrano & Colegiales
            </button>
            <span>·</span>
            <span>Términos & Condiciones</span>
            <span>·</span>
            <span>Defensa de las y los Consumidores</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
