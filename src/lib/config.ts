export const config = {
  app: {
    name: 'CartCraft',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cartcraft',
    dbName: 'cartcraft',
  },
  cart: {
    maxItems: 99,
    guestCartExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    sessionCookieName: 'cartcraft_session',
  },
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
} as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(config.currency.locale, {
    style: 'currency',
    currency: config.currency.code,
  }).format(amount);
}

export type Config = typeof config;
