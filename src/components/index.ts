/**
 * CartCraft React Components
 * 
 * Pre-built, customizable React components for integrating shopping cart
 * functionality into your Next.js application. All components support
 * Tailwind CSS theming and shadcn/ui design patterns.
 * 
 * @example
 * ```tsx
 * import { CartProvider, CartWidget, CartButton } from 'cartcraft/components';
 * 
 * function App({ children }) {
 *   return (
 *     <CartProvider config={{ currency: 'USD' }}>
 *       <CartButton />
 *       <CartWidget />
 *       {children}
 *     </CartProvider>
 *   );
 * }
 * ```
 * 
 * @packageDocumentation
 */

export { CartProvider, useCart } from './cart/CartProvider';

// Re-export component types for consumers
export type { CartProviderProps, CartContextValue } from './cart/CartProvider';

/**
 * Component variant types for theming
 */
export type CartTheme = 'light' | 'dark' | 'system';
export type CartSize = 'sm' | 'md' | 'lg';
export type CartPosition = 'left' | 'right';

/**
 * Common props shared across cart components
 */
export interface CartComponentProps {
  /** Visual theme variant */
  theme?: CartTheme;
  /** Component size */
  size?: CartSize;
  /** Additional CSS classes */
  className?: string;
}
