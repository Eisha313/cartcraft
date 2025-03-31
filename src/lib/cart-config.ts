import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CartThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export interface CartWidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBadge: boolean;
  badgeAnimation: boolean;
  currency: string;
  locale: string;
  enableGuestCheckout: boolean;
  persistCart: boolean;
  theme: Partial<CartThemeConfig>;
}

export const defaultTheme: CartThemeConfig = {
  primary: 'hsl(222.2 47.4% 11.2%)',
  secondary: 'hsl(210 40% 96.1%)',
  accent: 'hsl(210 40% 96.1%)',
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(222.2 47.4% 11.2%)',
  muted: 'hsl(210 40% 96.1%)',
  border: 'hsl(214.3 31.8% 91.4%)',
  radius: 'md',
};

export const defaultCartConfig: CartWidgetConfig = {
  position: 'bottom-right',
  showBadge: true,
  badgeAnimation: true,
  currency: 'USD',
  locale: 'en-US',
  enableGuestCheckout: true,
  persistCart: true,
  theme: defaultTheme,
};

export function createCartConfig(config: Partial<CartWidgetConfig> = {}): CartWidgetConfig {
  return {
    ...defaultCartConfig,
    ...config,
    theme: {
      ...defaultTheme,
      ...config.theme,
    },
  };
}

export function getPositionClasses(position: CartWidgetConfig['position']): string {
  const positions = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };
  return positions[position];
}

export function getRadiusClass(radius: CartThemeConfig['radius']): string {
  const radiusMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  return radiusMap[radius];
}

export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount / 100);
}
