/**
 * CartCraft React Components
 * 
 * Pre-built, customizable React components for integrating
 * shopping cart functionality into your Next.js application.
 * 
 * @example
 * ```tsx
 * import { CartProvider, useCart } from 'cartcraft/components';
 * 
 * function App({ children }) {
 *   return (
 *     <CartProvider config={{ currency: 'USD' }}>
 *       {children}
 *     </CartProvider>
 *   );
 * }
 * ```
 */

export { CartProvider, useCart } from './cart/CartProvider';
export type { CartProviderProps, CartContextValue } from './cart/CartProvider';
