import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Palette, 
  Type, 
  Layers, 
  Check, 
  Copy,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getCustomLogo, setCustomLogo, removeCustomLogo, subscribeToLogoChanges } from '../utils/logoStorage';

interface BrandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandbookModal: React.FC<BrandbookModalProps> = ({ isOpen, onClose }) => {
  const [copiedColor, setCopiedColor] = React.useState<string | null>(null);
  const [activeLogo, setActiveLogo] = useState<string | null>(() => getCustomLogo('color'));
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToLogoChanges(() => {
      setActiveLogo(getCustomLogo('color'));
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const colors = [
    { name: 'Cyan Principal', hex: '#10A4C7', pantone: 'Pantone 312 C', role: 'Primario Marca' },
    { name: 'Deep Ocean Blue', hex: '#006899', pantone: 'Pantone 301 C', role: 'Secundario Primario' },
    { name: 'Deep Violet', hex: '#13007C', pantone: 'Pantone 2745 C', role: 'Acento Nocturno' },
    { name: 'Mint Tech', hex: '#48FEC1', pantone: 'Pantone 3375 C', role: 'Éxito & Destacados' },
    { name: 'Solar Amber', hex: '#FFB000', pantone: 'Pantone 1235 C', role: 'Llamados a Acción' },
  ];

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido. Por favor selecciona una imagen (PNG, JPG, SVG o WEBP).');
      return;
    }

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande (máximo 3 MB para almacenamiento local seguro).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const success = setCustomLogo(dataUrl);
        if (success) {
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setUploadError('No se pudo guardar la imagen. Verifica que sea un archivo de imagen válido.');
        }
      }
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1">
              <BrandLogo iconOnly size="xs" variant="white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">
                Brandbook Oficial · MEGASTATION SHOP
              </h2>
              <p className="text-[11px] text-sky-200">
                Manual de Identidad Visual, Logotipo, Tipografías y Sistema Gráfico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Slogan Banner */}
          <div className="bg-gradient-to-r from-[#10A4C7] via-[#006899] to-[#13007C] text-white p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="relative z-10 max-w-xl space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#48FEC1] bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                Lema de Marca & Esencia
              </span>
              <h3 className="text-2xl font-black text-white">
                "Somos como el agua, nos adaptamos a cada cliente"
              </h3>
              <p className="text-xs text-sky-100 leading-relaxed">
                La identidad representa dinamismo, fluidez y cercanía. El agua fluye y toma la forma de su recipiente, del mismo modo en que Megastation adapta su oferta tecnológica a las necesidades de cada usuario en Belgrano y Colegiales.
              </p>
            </div>

            {/* Background water wave decoration */}
            <div className="absolute -right-8 -bottom-10 opacity-25 pointer-events-none">
              <svg width="220" height="180" viewBox="0 0 200 160" fill="none">
                <path
                  d="M 20 140 C 80 40 140 180 190 60"
                  stroke="#48FEC1"
                  strokeWidth="28"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#10A4C7]" />
              Paleta Cromática Oficial
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {colors.map((c) => (
                <div
                  key={c.hex}
                  onClick={() => handleCopy(c.hex)}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#10A4C7] cursor-pointer transition-all space-y-2 group shadow-2xs"
                >
                  <div
                    className="w-full h-16 rounded-xl shadow-inner relative flex items-end justify-end p-1.5"
                    style={{ backgroundColor: c.hex }}
                  >
                    {copiedColor === c.hex && (
                      <span className="bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-400" /> Copiado
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 line-clamp-1">{c.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{c.hex}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography System */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#006899]" />
              Sistema Tipográfico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Titulares & Display</span>
                <div className="text-lg font-black text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Montserrat (ExtraBold & Black)
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Tipografía geométrica con fuerza, modernidad y presencia de marca en títulos y cartelería.
                </p>
                <div className="text-xs font-mono text-slate-400 pt-1">
                  Aa Bb Cc Dd Ee Ff Gg Hh 0123456789
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cuerpo, UI & Precios</span>
                <div className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Plus Jakarta Sans
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Alta legibilidad en pantallas digitales, interfaces de comercio electrónico y fichas de producto.
                </p>
                <div className="text-xs font-mono text-slate-400 pt-1">
                  Aa Bb Cc Dd Ee Ff Gg Hh 0123456789
                </div>
              </div>
            </div>
          </div>

          {/* Logo Versions and Construction */}
          <div className="space-y-4">
            {/* Custom Logo Upload Card (Direct File Usage) */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-dashed border-sky-300 rounded-2xl p-5 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00ADEF]/15 border border-[#00ADEF]/30 flex items-center justify-center text-[#006899] flex-shrink-0 mt-0.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Usar tu archivo de imagen original (MGST - Logo- Color.png)
                      {activeLogo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Archivo Activo
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Arrastra tu archivo aquí o selecciónalo para que la tienda use <strong>exactamente tus píxeles originales</strong> sin recreación ni alteraciones.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#006899] hover:bg-[#005A94] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Seleccionar archivo PNG
                  </button>

                  {activeLogo && (
                    <button
                      type="button"
                      onClick={() => removeCustomLogo()}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                      title="Restaurar logotipo predeterminado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drop target zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-4 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#00ADEF] bg-sky-100/60'
                    : 'border-slate-300 hover:border-[#00ADEF] bg-white/80 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ImageIcon className="w-4 h-4 text-[#006899]" />
                  <span>
                    {isDragging
                      ? 'Suelta aquí tu archivo MGST - Logo- Color.png...'
                      : 'Arrastra y suelta aquí tu archivo MGST - Logo- Color.png (o haz clic para explorar)'}
                  </span>
                </div>
              </div>

              {/* Status messages */}
              {uploadError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>¡Logotipo oficial cargado y aplicado con éxito en todo el sitio!</span>
                </div>
              )}

              <div className="mt-2.5 text-[11px] text-slate-500 bg-white/60 rounded-lg p-2 border border-slate-200/60">
                💡 <strong>Nota sobre archivos:</strong> Los archivos adjuntados al chat no se copian al disco automáticamente. Al subirlo aquí (o copiarlo a la carpeta <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">public/logo.png</code> en el explorador de archivos de AI Studio), se aplicará de inmediato en toda la tienda.
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#10A4C7]" />
                Logotipo Oficial & Construcción Visual
              </h3>
              <a
                href="/logo.svg"
                download="MEGASTATION-Logo-Oficial.svg"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#006899] hover:text-[#10A4C7] bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Descargar SVG Oficial
              </a>
            </div>

            {/* Main Official Master Logo Showcase */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs min-w-[220px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Diseño Oficial (MGST - Logo- Color)
                </span>
                <BrandLogo size="xl" layout="stacked" variant="color" />
              </div>

              <div className="space-y-3 text-xs text-slate-600 max-w-md">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF] mt-1.5 flex-shrink-0" />
                  <p>
                    <strong className="text-slate-900 font-bold">Monograma Cinta Fluida (mG):</strong> Trazo curvo con remates redondeados que sintetiza las iniciales «m» y «G». Su fluidez continua encarna el lema de marca <em>«Somos como el agua»</em>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#005A9C] mt-1.5 flex-shrink-0" />
                  <p>
                    <strong className="text-slate-900 font-bold">Tipografía Dual MEGA STATION:</strong> Palabra <em>MEGA</em> en cyan pleno con vértices suaves, seguida de <em>STATION</em> en trazo contorneado (outline) azul océano profundo.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#48FEC1] mt-1.5 flex-shrink-0" />
                  <p>
                    <strong className="text-slate-900 font-bold">Gradiente Oficial:</strong> Transición luminosa desde Cyan (#00ADEF) hasta Deep Ocean Blue (#005A94).
                  </p>
                </div>
              </div>
            </div>

            {/* Application Variants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Horizontal / Web Positive */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Versión Horizontal (Cabecera)</span>
                <div className="py-2">
                  <BrandLogo size="md" layout="horizontal" variant="color" />
                </div>
                <span className="text-[10px] text-slate-500">Cabeceras web, barras de navegación y documentos</span>
              </div>

              {/* Dark negative */}
              <div className="bg-gradient-to-br from-[#006899] to-[#13007C] border border-sky-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-sky-200 uppercase">Versión Negativa</span>
                <div className="py-2">
                  <BrandLogo size="md" layout="horizontal" variant="white" />
                </div>
                <span className="text-[10px] text-sky-200">Marquesinas de locales, uniformes y fondos oscuros</span>
              </div>

              {/* Monochrome */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Versión Monocromática</span>
                <div className="py-2">
                  <BrandLogo size="md" layout="horizontal" variant="monochrome" />
                </div>
                <span className="text-[10px] text-slate-500">Tickets fiscales térmicos y etiquetas de código de barras</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
