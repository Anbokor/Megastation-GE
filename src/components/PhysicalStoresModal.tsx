import React from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  Check, 
  Wrench, 
  ShieldCheck, 
  Navigation,
  MessageCircle
} from 'lucide-react';
import { StoreBranch, StoreBranchId } from '../types';

interface PhysicalStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: StoreBranch[];
  selectedBranchId: StoreBranchId;
  onSelectBranch: (id: StoreBranchId) => void;
}

export const PhysicalStoresModal: React.FC<PhysicalStoresModalProps> = ({
  isOpen,
  onClose,
  branches,
  selectedBranchId,
  onSelectBranch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#10A4C7]" />
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Nuestros Locales Físicos en Buenos Aires
              </h2>
              <p className="text-[11px] text-slate-500">
                Atención personalizada, retiro express en 1 hora y servicio técnico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches
              .filter((b) => b.type === 'store')
              .map((branch) => {
                const isSelected = selectedBranchId === branch.id;
                return (
                  <div
                    key={branch.id}
                    className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'border-[#10A4C7] bg-sky-50/50 shadow-md ring-2 ring-[#10A4C7]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#10A4C7] bg-sky-100 px-2 py-0.5 rounded">
                            Local a la calle
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-1">
                            {branch.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] bg-[#10A4C7] text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Activa
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#10A4C7] flex-shrink-0" />
                          <span className="font-semibold text-slate-900">{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{branch.hours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                      </div>

                      {/* Store Services list */}
                      <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600">
                        <div className="font-bold text-slate-800 mb-1">Servicios en este local:</div>
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Check className="w-3 h-3" />
                          <span>Retiro de compras web en 1 hora</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Check className="w-3 h-3" />
                          <span>Asesoramiento y venta minorista / mayorista</span>
                        </div>
                        {branch.id === 'colegiales' && (
                          <div className="flex items-center gap-1.5 text-[#006899] font-bold">
                            <Wrench className="w-3 h-3" />
                            <span>Laboratorio de Servicio Técnico Express</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBranch(branch.id);
                          onClose();
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-[#10A4C7] hover:bg-[#006899] text-white'
                        }`}
                      >
                        {isSelected ? 'Sucursal Seleccionada' : 'Seleccionar como Mi Local'}
                      </button>

                      <a
                        href={`https://wa.me/5491147819000?text=Hola%20Megastation,%20consulto%20por%20la%20sucursal%20${branch.shortName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs flex items-center justify-center transition-colors shadow-2xs"
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Central warehouse info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">
                Centro de Distribución & Logística (Almagro)
              </span>
              <p className="text-slate-500 text-[11px]">
                Av. Corrientes 4500, CABA · Exclusivo despacho para Envíos a todo el país y abastecimiento de sucursales.
              </p>
            </div>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md">
              Depósito Central
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
