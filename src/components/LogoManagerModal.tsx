import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon,
  FolderOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { 
  getCustomLogo, 
  setCustomLogo, 
  removeCustomLogo, 
  subscribeToLogoChanges 
} from '../utils/logoStorage';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({ isOpen, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState<'color' | 'white' | 'monochrome'>('color');
  const [colorLogo, setColorLogo] = useState<string | null>(() => getCustomLogo('color'));
  const [whiteLogo, setWhiteLogo] = useState<string | null>(() => getCustomLogo('white'));
  const [blackLogo, setBlackLogo] = useState<string | null>(() => getCustomLogo('monochrome'));

  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshLogos = () => {
    setColorLogo(getCustomLogo('color'));
    setWhiteLogo(getCustomLogo('white'));
    setBlackLogo(getCustomLogo('monochrome'));
  };

  useEffect(() => {
    refreshLogos();
    const unsub = subscribeToLogoChanges(refreshLogos);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleProcessFile = (file: File, variant: 'color' | 'white' | 'monochrome') => {
    setStatusMessage(null);

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor seleccioná un archivo de imagen (PNG, JPG, SVG o WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'El archivo supera el tamaño máximo permitido (5 MB).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const ok = setCustomLogo(dataUrl, variant);
        if (ok) {
          setStatusMessage({ 
            type: 'success', 
            text: `¡Logotipo (${variant === 'color' ? 'Color' : variant === 'white' ? 'Blanco' : 'Negro'}) guardado exitosamente en el sistema!` 
          });
          refreshLogos();
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage({ type: 'error', text: 'No se pudo guardar la imagen. Verificá que no esté dañada.' });
        }
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Error al leer el archivo desde el dispositivo.' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0], selectedVariant);
    }
  };

  const handleRestoreDefaults = (variant?: 'color' | 'white' | 'monochrome') => {
    removeCustomLogo(variant);
    refreshLogos();
    setStatusMessage({ 
      type: 'success', 
      text: variant ? `Restaurado logotipo original predeterminado para ${variant}.` : 'Restaurados todos los logotipos predeterminados de la carpeta /public/logo/.' 
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <span>Gestor de Archivos de Logotipo</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-400/30">
                  MEGA STATION
                </span>
              </h2>
              <p className="text-xs text-sky-200">
                Carga directa de archivos de logotipo originales para toda la tienda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Explanation Banner */}
          <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/60 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#006899]">
              <Sparkles className="w-4 h-4 text-[#10A4C7]" />
              <span>Usá tus archivos oficiales sin alteraciones</span>
            </div>
            <p className="text-slate-600">
              Podés subir tus archivos PNG transparentes o SVG directamente aquí. Se guardan y se aplican de forma inmediata en la cabecera, banners, sucursales, pie de página y comprobantes de compra.
            </p>
            <p className="text-[11px] text-slate-500 font-mono pt-1">
              Rutas físicas del servidor: <code className="text-[#006899] font-bold">/public/logo/</code> y <code className="text-[#006899] font-bold">/public/assets/</code>
            </p>
          </div>

          {/* Variant Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Seleccionar variante a cargar / personalizar:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedVariant('color')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedVariant === 'color'
                    ? 'border-[#10A4C7] bg-sky-50/80 text-[#006899] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#10A4C7]" />
                <span>Logo Color</span>
                <span className="text-[10px] font-normal text-slate-500">Cabecera / Catálogo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('white')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedVariant === 'white'
                    ? 'border-[#10A4C7] bg-sky-50/80 text-[#006899] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-300" />
                <span>Logo Blanco</span>
                <span className="text-[10px] font-normal text-slate-500">Footer / Fondos oscuros</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('monochrome')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedVariant === 'monochrome'
                    ? 'border-[#10A4C7] bg-sky-50/80 text-[#006899] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black" />
                <span>Logo Negro</span>
                <span className="text-[10px] font-normal text-slate-500">Tickets / Comprobantes</span>
              </button>
            </div>
          </div>

          {/* Current Variant Preview */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Vista previa activa ({selectedVariant}):
              </span>
              {(selectedVariant === 'color' ? colorLogo : selectedVariant === 'white' ? whiteLogo : blackLogo) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Archivo personalizado activo
                </span>
              )}
            </div>

            <div className={`py-6 px-4 rounded-xl flex items-center justify-center border transition-all ${
              selectedVariant === 'white'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200'
            }`}>
              <BrandLogo size="lg" variant={selectedVariant} layout="horizontal" showSlogan={true} />
            </div>
          </div>

          {/* Drag & Drop File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-[#10A4C7] bg-sky-50 scale-[1.01]'
                : 'border-slate-300 hover:border-[#10A4C7] bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto mb-3 text-[#10A4C7]">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-800">
              Subir tu archivo para la variante {selectedVariant.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Arrastrá y soltá tu archivo aquí, o hacé clic para explorar desde tu computadora.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0], selectedVariant);
                }
              }}
            />

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-[#006899] hover:bg-[#00557d] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Elegir Archivo del Dispositivo</span>
              </button>

              {(selectedVariant === 'color' ? colorLogo : selectedVariant === 'white' ? whiteLogo : blackLogo) && (
                <button
                  type="button"
                  onClick={() => handleRestoreDefaults(selectedVariant)}
                  className="px-3.5 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Restaurar Predeterminado</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => handleRestoreDefaults()}
            className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar todos a originales (/logo/)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
