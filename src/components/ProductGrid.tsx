'use client';

import { useCart } from '@/components/cart/CartProvider';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export function ProductGrid({ products }: { products: Product[] }) {
  const { addItem, items } = useCart();

  const isInCart = (id: string) => items.some(item => item.id === id);

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="font-medium">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map(product => (
        <div
          key={product.id}
          className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="p-4 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {product.category}
            </span>
            <h3 className="font-semibold text-card-foreground leading-snug">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>

              <button
                onClick={() => addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                })}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.96] ${
                  isInCart(product.id)
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {isInCart(product.id) ? 'Add More' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
