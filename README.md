# CartCraft

A lightweight, embeddable shopping cart widget library for Next.js applications with Stripe checkout integration and MongoDB persistence.

## Features

- 🛒 Drop-in cart widget with customizable Tailwind/shadcn themes
- 💳 Pre-built Stripe checkout with webhook handlers
- 🗄️ MongoDB cart persistence (guest & authenticated sessions)
- 📦 Product catalog API with real-time inventory tracking
- 🏷️ Discount code system (percentage, fixed, free shipping)

## Installation

```bash
npm install
# or
pnpm install
```

## Environment Setup

Create a `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/cartcraft
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXTAUTH_SECRET=your-secret-key
```

## Usage

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Embedding the Cart Widget

```tsx
import { CartProvider, CartWidget } from '@/components/cart';

export default function App({ children }) {
  return (
    <CartProvider>
      {children}
      <CartWidget theme="light" position="bottom-right" />
    </CartProvider>
  );
}
```

### Adding Items to Cart

```tsx
import { useCart } from '@/hooks/useCart';

function ProductCard({ product }) {
  const { addItem } = useCart();
  
  return (
    <button onClick={() => addItem(product, 1)}>
      Add to Cart
    </button>
  );
}
```

### API Endpoints

- `POST /api/cart` - Add/update cart items
- `GET /api/cart` - Get current cart
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `GET /api/products` - List products with inventory
- `POST /api/discounts/validate` - Validate discount codes

## License

MIT