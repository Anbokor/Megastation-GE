import React from 'react';
import { EMBEDDED_OFFICIAL_LOGOS, LogoVariant } from '../utils/embeddedLogos';

export interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: LogoVariant;
  layout?: 'horizontal' | 'stacked';
  showSlogan?: boolean;
  iconOnly?: boolean;
  useMasterSquare?: boolean;
}

const SIZE_CLASSES = {
  xs: 'h-6 max-h-6',
  sm: 'h-8 max-h-8',
  md: 'h-11 sm:h-12 max-h-12',
  lg: 'h-14 sm:h-16 max-h-16',
  xl: 'h-20 sm:h-24 max-h-24',
};

const ICON_SIZE_CLASSES = {
  xs: 'h-6 w-auto max-h-6',
  sm: 'h-8 w-auto max-h-8',
  md: 'h-10 w-auto max-h-10',
  lg: 'h-12 w-auto max-h-12',
  xl: 'h-16 w-auto max-h-16',
};

/**
 * Official Brand Logo for MEGA STATION
 * Renders authentic brand assets (Full Color, White Negative, Monochrome Black)
 * with pixel-perfect contrast and responsive visual hierarchy.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'color',
  layout = 'horizontal',
  showSlogan = false,
  iconOnly = false,
  useMasterSquare = false,
}) => {
  // Select authentic asset path based on variant, icon mode, and canvas type
  const logoSrc = iconOnly
    ? EMBEDDED_OFFICIAL_LOGOS.icon[variant]
    : useMasterSquare
    ? EMBEDDED_OFFICIAL_LOGOS.master[variant]
    : EMBEDDED_OFFICIAL_LOGOS.tight[variant];

  const heightClass = iconOnly 
    ? (ICON_SIZE_CLASSES[size] || ICON_SIZE_CLASSES.md)
    : (SIZE_CLASSES[size] || SIZE_CLASSES.md);

  // Slogan text styling according to background contrast variant
  const sloganClass = 
    variant === 'white' 
      ? 'text-[#48FEC1]' 
      : variant === 'monochrome' 
      ? 'text-slate-700' 
      : 'text-[#005A9C]';

  const altText = iconOnly
    ? 'MEGA STATION Isotipo mG'
    : `MEGA STATION Logo Oficial (${variant === 'white' ? 'Negativo' : variant === 'monochrome' ? 'Monocromo' : 'Color'})`;

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}>
        <img
          src={logoSrc}
          alt={altText}
          className={`${heightClass} object-contain transition-transform`}
          loading="eager"
        />
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center select-none text-center ${className}`}>
        <img
          src={logoSrc}
          alt={altText}
          className={`${heightClass} w-auto object-contain transition-transform`}
          loading="eager"
        />
        {showSlogan && (
          <span className={`text-[10px] sm:text-[11px] tracking-wider uppercase font-bold mt-1.5 ${sloganClass}`}>
            Somos como el agua · Celulares y Accesorios
          </span>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src={logoSrc}
        alt={altText}
        className={`${heightClass} w-auto object-contain transition-transform`}
        loading="eager"
      />
      {showSlogan && (
        <div className="flex flex-col justify-center text-left">
          <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase leading-tight ${sloganClass}`}>
            Somos como el agua
          </span>
          <span className={`text-[9px] font-medium leading-tight ${variant === 'white' ? 'text-sky-200' : 'text-slate-400'}`}>
            Celulares y Accesorios
          </span>
        </div>
      )}
    </div>
  );
};
