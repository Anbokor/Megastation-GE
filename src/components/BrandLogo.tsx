import React from 'react';

export interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'color' | 'white' | 'monochrome';
  layout?: 'horizontal' | 'stacked';
  showSlogan?: boolean;
  iconOnly?: boolean;
}

const SIZE_CLASSES = {
  xs: 'h-8 max-h-8',
  sm: 'h-12 max-h-12',
  md: 'h-14 sm:h-16 max-h-16',
  lg: 'h-16 sm:h-20 max-h-20',
  xl: 'h-24 sm:h-32 max-h-32',
};

/**
 * Official Brand Logo for MEGA STATION
 * Renders authentic logo assets directly as static images without modifying,
 * re-drawing, or distorting the brand's original graphics.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'color',
  layout = 'horizontal',
  showSlogan = false,
  iconOnly = false,
}) => {
  // Always use /logo.png as requested by the user
  const logoSrc = '/logo.png';

  const heightClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // Slogan text styling according to variant contrast
  const sloganClass = 
    variant === 'white' 
      ? 'text-[#48FEC1]' 
      : variant === 'monochrome' 
      ? 'text-slate-500' 
      : 'text-[#005A9C]';

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={logoSrc}
          alt="MEGA STATION Logo"
          className={`${heightClass} w-auto object-contain`}
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
          alt="MEGA STATION Logo"
          className={`${heightClass} w-auto object-contain`}
          loading="eager"
        />
        {showSlogan && (
          <span className={`text-[10px] tracking-wider uppercase font-semibold mt-1.5 ${sloganClass}`}>
            Somos como el agua · Celulares y Accesorios
          </span>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={logoSrc}
        alt="MEGA STATION Logo"
        className={`${heightClass} w-auto object-contain`}
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
