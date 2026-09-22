import React from 'react';
import { 
  X, 
  Sparkles, 
  Palette, 
  Type, 
  Layers, 
  Check, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface BrandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandbookModal: React.FC<BrandbookModalProps> = ({ isOpen, onClose }) => {
  const [copiedColor, setCopiedColor] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const colors = [
    { name: 'Cyan Principal', hex: '#10A4C7', pantone: 'Pantone 312 C', role: 'Primario Marca' },
    { name: 'Deep Ocean Blue', hex: '#006899', pantone: 'Pantone 301 C', role: 'Secundario Primario' },
    { name: 'Deep Violet', hex: '#13007C', pantone: 'Pantone 2745 C', role: 'Acento Nocturno' },
    { name: 'Aqua Mentha', hex: '#48FEC1', pantone: 'Pantone 354 C', role: 'Acento Brillante / Call to Action' },
    { name: 'Pure White', hex: '#FFFFFF', pantone: 'Blanco Neutro', role: 'Fondo & Contraste' },
    { name: 'Dark Slate', hex: '#0F172A', pantone: 'Negro Institucional', role: 'Tipografía & Estructura' },
  ];

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10A4C7]/20 border border-[#10A4C7]/40 flex items-center justify-center text-[#48FEC1]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Manual de Identidad Visual (Brandbook)</h2>
              <p className="text-xs text-slate-400">Megastation Shop · Normas de uso gráfico y cromático oficial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8">
          {/* Mission & Slogan Section */}
          <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006899] bg-sky-200/60 px-3 py-1 rounded-full">
                Esencia de Marca
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                «Somos como el agua»
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                Nuestra filosofía representa adaptabilidad, fluidez, transparencia y constancia. Proveemos telefonía celular y servicio técnico especializado con la máxima agilidad del mercado.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex items-center justify-center min-w-[180px]">
              <BrandLogo size="lg" layout="stacked" variant="color" />
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#10A4C7]" />
              Paleta Cromática Oficial
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {colors.map((c) => (
                <div
                  key={c.hex}
                  onClick={() => handleCopy(c.hex)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all group shadow-2xs"
                  title="Haz clic para copiar HEX"
                >
                  <div className="space-y-2">
                    <div
                      className="w-full h-12 rounded-xl shadow-inner border border-black/10 relative flex items-center justify-center"
                      style={{ backgroundColor: c.hex }}
                    >
                      {copiedColor === c.hex && (
                        <span className="absolute inset-0 bg-slate-900/80 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 justify-center animate-fade-in">
                          <Check className="w-3 h-3 text-[#48FEC1]" /> Copiado
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#006899] transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{c.hex}</div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/60 text-[9px] text-slate-400 font-medium">
                    {c.pantone}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography System */}
          <div className="space-y-4">
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#10A4C7]" />
                Logotipo Oficial & Construcción Visual
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/logo-color.png"
                  download="MEGASTATION-Logo-Color-Oficial.png"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006899] hover:text-[#10A4C7] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors"
                  title="Descargar Logo Color Oficial"
                >
                  <ExternalLink className="w-3 h-3" />
                  Color PNG
                </a>
                <a
                  href="/logo-white.png"
                  download="MEGASTATION-Logo-Blanco-Oficial.png"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors"
                  title="Descargar Logo Blanco Negativo"
                >
                  <ExternalLink className="w-3 h-3" />
                  Blanco PNG
                </a>
                <a
                  href="/logo-black.png"
                  download="MEGASTATION-Logo-Monocromo-Oficial.png"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors"
                  title="Descargar Logo Negro Monocromo"
                >
                  <ExternalLink className="w-3 h-3" />
                  Negro PNG
                </a>
              </div>
            </div>

            {/* Main Official Master Logo Showcase */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs min-w-[220px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Diseño Oficial (MGST - Master Color)
                </span>
                <BrandLogo size="xl" layout="stacked" variant="color" useMasterSquare />
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
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Versión Horizontal (Cabecera)</span>
                <div className="py-2 flex items-center justify-center min-h-[60px]">
                  <BrandLogo size="md" layout="horizontal" variant="color" />
                </div>
                <span className="text-[10px] text-slate-500">Cabeceras web, barras de navegación y documentos claros</span>
              </div>

              {/* Dark negative */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-sky-200 uppercase">Versión Negativa Oficial</span>
                <div className="py-2 flex items-center justify-center min-h-[60px]">
                  <BrandLogo size="md" layout="horizontal" variant="white" />
                </div>
                <span className="text-[10px] text-slate-400">Pie de página (Footer), marquesinas y fondos oscuros</span>
              </div>

              {/* Monochrome */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Versión Monocromática Oficial</span>
                <div className="py-2 flex items-center justify-center min-h-[60px]">
                  <BrandLogo size="md" layout="horizontal" variant="monochrome" />
                </div>
                <span className="text-[10px] text-slate-500">Tickets fiscales térmicos POS y remitos de entrega</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
