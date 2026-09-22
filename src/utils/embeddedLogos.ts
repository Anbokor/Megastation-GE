// Official authentic brand assets for MEGA STATION
export type LogoVariant = 'color' | 'white' | 'monochrome';

export const EMBEDDED_OFFICIAL_LOGOS = {
  // Tight cropped assets for responsive web UI (zero empty vertical margin)
  tight: {
    color: '/logo-color-tight.png',
    white: '/logo-white-tight.png',
    monochrome: '/logo-monochrome-tight.png',
  },
  // Original master assets (1024x1024 square canvas with full margins)
  master: {
    color: '/logo-color.png',
    white: '/logo-white.png',
    monochrome: '/logo-black.png',
  },
  // Monogram emblem-only icons (mG ribbon without typography)
  icon: {
    color: '/icon-color.png',
    white: '/icon-white.png',
    monochrome: '/icon-monochrome.png',
  },
} as const;

// Default mapping for backward compatibility
export const OFFICIAL_LOGO_PATHS: Record<LogoVariant, string> = {
  color: EMBEDDED_OFFICIAL_LOGOS.tight.color,
  white: EMBEDDED_OFFICIAL_LOGOS.tight.white,
  monochrome: EMBEDDED_OFFICIAL_LOGOS.tight.monochrome,
};
