'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { ProductGrid } from '@/components/ProductGrid';

const demoProducts = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', category: 'Electronics', description: 'Premium over-ear wireless headphones with noise cancellation.' },
  { id: 'p2', name: 'Leather Backpack', price: 124.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', category: 'Accessories', description: 'Handcrafted genuine leather backpack for everyday carry.' },
  { id: 'p3', name: 'Ceramic Coffee Mug', price: 18.99, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop', category: 'Home', description: 'Minimalist ceramic mug, perfect for your morning coffee.' },
  { id: 'p4', name: 'Running Sneakers', price: 139.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', category: 'Footwear', description: 'Lightweight performance running shoes with cushioned sole.' },
  { id: 'p5', name: 'Desk Lamp', price: 54.99, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop', category: 'Home', description: 'Adjustable LED desk lamp with warm and cool light modes.' },
  { id: 'p6', name: 'Sunglasses', price: 89.99, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', category: 'Accessories', description: 'Classic aviator sunglasses with UV400 protection.' },
  { id: 'p7', name: 'Mechanical Keyboard', price: 149.99, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop', category: 'Electronics', description: 'Tactile mechanical keyboard with RGB backlighting.' },
  { id: 'p8', name: 'Canvas Tote Bag', price: 34.99, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop', category: 'Accessories', description: 'Durable canvas tote bag with reinforced handles.' },
  { id: 'p9', name: 'Plant Pot Set', price: 42.99, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop', category: 'Home', description: 'Set of 3 minimalist ceramic pots for indoor plants.' },
  { id: 'p10', name: 'Smart Watch', price: 199.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', category: 'Electronics', description: 'Feature-packed smartwatch with health monitoring.' },
  { id: 'p11', name: 'Wool Scarf', price: 49.99, image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop', category: 'Accessories', description: 'Soft merino wool scarf for chilly days.' },
  { id: 'p12', name: 'Water Bottle', price: 29.99, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop', category: 'Home', description: 'Insulated stainless steel water bottle, keeps drinks cold 24hrs.' },
];

export default function Home() {
  const { totalItems, toggleCart, isOpen, setCartOpen } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(demoProducts.map(p => p.category)))];

  const filtered = demoProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">CartCraft</span>
          </div>

          <button
            onClick={toggleCart}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-cart-bounce">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
          Shop the Collection
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Curated essentials for everyday life. Add items to your cart and checkout seamlessly.
        </p>
      </section>

      {/* Filters */}
      <section className="container pb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="container pb-16">
        <ProductGrid products={filtered} />
      </section>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
