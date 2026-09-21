// Utility to manage user-uploaded brand logo in localStorage with security validation

const STORAGE_KEYS = {
  color: 'megastation_custom_logo_color',
  white: 'megastation_custom_logo_white',
  monochrome: 'megastation_custom_logo_monochrome',
  legacy: 'megastation_custom_logo',
};

const EVENT_NAME = 'megastation-logo-updated';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

const ALLOWED_MIME_PREFIXES = [
  'data:image/png',
  'data:image/jpeg',
  'data:image/jpg',
  'data:image/webp',
  'data:image/svg+xml',
  'data:image/gif',
];

/**
 * Validates that a string is a safe image URI (data URI or safe local asset path)
 */
export const isSafeImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Safe local static paths
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(trimmed);
  }

  // Safe data:image/ URIs
  const isImageMime = ALLOWED_MIME_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!isImageMime) return false;

  // Strict check: disallow javascript:, vbscript:, or html-based data URIs
  if (/^(javascript|vbscript|data:text\/html)/i.test(trimmed)) {
    return false;
  }

  return true;
};

export const getCustomLogo = (variant: 'color' | 'white' | 'monochrome' = 'color'): string | null => {
  try {
    const key = STORAGE_KEYS[variant] || STORAGE_KEYS.color;
    const raw = localStorage.getItem(key) || (variant === 'color' ? localStorage.getItem(STORAGE_KEYS.legacy) : null);
    if (!raw) return null;
    return isSafeImageUrl(raw) ? raw : null;
  } catch (err) {
    console.warn('LocalStorage inaccessible:', err);
    return null;
  }
};

export const setCustomLogo = (dataUrl: string, variant: 'color' | 'white' | 'monochrome' = 'color'): boolean => {
  try {
    if (!isSafeImageUrl(dataUrl)) {
      console.error('Security check failed: Invalid or unsafe image format.');
      return false;
    }

    if (dataUrl.length > MAX_IMAGE_SIZE_BYTES * 1.37) { // Base64 overhead buffer
      console.error('File size exceeds safe storage limits (max 5MB).');
      return false;
    }

    const key = STORAGE_KEYS[variant] || STORAGE_KEYS.color;
    localStorage.setItem(key, dataUrl);
    if (variant === 'color') {
      localStorage.setItem(STORAGE_KEYS.legacy, dataUrl);
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { variant, dataUrl } }));
    return true;
  } catch (err) {
    console.error('Failed to save logo to localStorage (quota exceeded or storage blocked)', err);
    return false;
  }
};

export const removeCustomLogo = (variant?: 'color' | 'white' | 'monochrome'): void => {
  try {
    if (variant) {
      localStorage.removeItem(STORAGE_KEYS[variant]);
      if (variant === 'color') localStorage.removeItem(STORAGE_KEYS.legacy);
    } else {
      localStorage.removeItem(STORAGE_KEYS.color);
      localStorage.removeItem(STORAGE_KEYS.white);
      localStorage.removeItem(STORAGE_KEYS.monochrome);
      localStorage.removeItem(STORAGE_KEYS.legacy);
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { variant, dataUrl: null } }));
  } catch (err) {
    console.error('Failed to remove logo', err);
  }
};

export const subscribeToLogoChanges = (callback: () => void): (() => void) => {
  const handler = () => {
    callback();
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
};
