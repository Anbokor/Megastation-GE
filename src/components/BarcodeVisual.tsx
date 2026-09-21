import React from 'react';
import { Copy, Check } from 'lucide-react';

interface BarcodeVisualProps {
  value: string;
  className?: string;
  showText?: boolean;
  height?: number;
  interactive?: boolean;
  onSelectBarcode?: (barcode: string) => void;
}

/**
 * Generates an authentic EAN-13 aesthetic barcode in pure SVG.
 * Includes start/center/end guard bars and proportional code line widths.
 */
export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  value,
  className = '',
  showText = true,
  height = 36,
  interactive = false,
  onSelectBarcode,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Deterministic bar widths based on digit characters to generate realistic barcode stripes
  const bars = React.useMemo(() => {
    const cleanValue = value.replace(/\D/g, '') || '7798001001018';
    const pattern: { width: number; isSpace: boolean; isGuard?: boolean }[] = [];

    // Left guard
    pattern.push({ width: 2, isSpace: false, isGuard: true });
    pattern.push({ width: 2, isSpace: true, isGuard: true });
    pattern.push({ width: 2, isSpace: false, isGuard: true });

    // Digits pattern
    for (let i = 0; i < cleanValue.length; i++) {
      const digit = parseInt(cleanValue[i], 10) || 0;
      const w1 = ((digit * 3 + 1) % 3) + 1;
      const s1 = ((digit * 2 + 2) % 3) + 1;
      const w2 = ((digit + 2) % 3) + 1;
      const s2 = ((digit * 4 + 1) % 3) + 1;

      pattern.push({ width: w1, isSpace: false });
      pattern.push({ width: s1, isSpace: true });
      pattern.push({ width: w2, isSpace: false });
      pattern.push({ width: s2, isSpace: true });

      // Center guard after half
      if (i === Math.floor(cleanValue.length / 2)) {
        pattern.push({ width: 2, isSpace: true, isGuard: true });
        pattern.push({ width: 2, isSpace: false, isGuard: true });
        pattern.push({ width: 2, isSpace: true, isGuard: true });
        pattern.push({ width: 2, isSpace: false, isGuard: true });
        pattern.push({ width: 2, isSpace: true, isGuard: true });
      }
    }

    // Right guard
    pattern.push({ width: 2, isSpace: false, isGuard: true });
    pattern.push({ width: 2, isSpace: true, isGuard: true });
    pattern.push({ width: 2, isSpace: false, isGuard: true });

    return pattern;
  }, [value]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (onSelectBarcode) {
      onSelectBarcode(value);
    }
  };

  let currentX = 10;
  const renderedBars = bars.map((bar, idx) => {
    const x = currentX;
    currentX += bar.width;
    if (bar.isSpace) return null;

    const barHeight = bar.isGuard ? height : height - 6;
    return (
      <rect
        key={idx}
        x={x}
        y="2"
        width={bar.width}
        height={barHeight}
        fill="#0f172a"
      />
    );
  });

  return (
    <div
      onClick={interactive && onSelectBarcode ? () => onSelectBarcode(value) : undefined}
      className={`inline-flex flex-col items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs transition-all ${
        interactive ? 'cursor-pointer hover:border-[#10A4C7] hover:shadow-md' : ''
      } ${className}`}
      title={interactive ? 'Hacer clic para simular escaneo de código' : undefined}
    >
      <svg
        width={currentX + 10}
        height={height + (showText ? 16 : 4)}
        viewBox={`0 0 ${currentX + 10} ${height + (showText ? 16 : 4)}`}
        className="max-w-full"
      >
        {renderedBars}
        {showText && (
          <text
            x={(currentX + 10) / 2}
            y={height + 12}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="11"
            letterSpacing="2"
            fill="#334155"
            fontWeight="600"
          >
            {value}
          </text>
        )}
      </svg>

      <div className="flex items-center gap-1 mt-0.5">
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] text-slate-500 hover:text-[#006899] flex items-center gap-1 font-mono transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copiar EAN</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
