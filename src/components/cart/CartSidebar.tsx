'use client';

import { useCart } from './CartProvider';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

type Step = 'cart' | 'shipping' | 'payment' | 'confirmed';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
}

const SHIPPING_COST = 5.99;
const FREE_SHIPPING_THRESHOLD = 75;
const TAX_RATE = 0.08;

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('cart');
  const [shipping, setShipping] = useState<ShippingInfo>({ name: '', email: '', address: '', city: '', zip: '' });
  const [payment, setPayment] = useState<PaymentInfo>({ cardNumber: '', expiry: '', cvc: '', nameOnCard: '' });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset to cart step when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (step !== 'confirmed') setStep('cart');
      }, 300);
    }
  }, [isOpen, step]);

  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = promoApplied ? totalPrice * 0.1 : 0;
  const tax = (totalPrice - discount) * TAX_RATE;
  const orderTotal = totalPrice - discount + shippingCost + tax;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const isShippingValid = shipping.name.trim() && shipping.email.includes('@') && shipping.address.trim() && shipping.city.trim() && shipping.zip.trim();
  const isPaymentValid = payment.cardNumber.replace(/\s/g, '').length >= 15 && payment.expiry.length >= 4 && payment.cvc.length >= 3 && payment.nameOnCard.trim();

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setPromoApplied(true);
    }
  };

  const handlePlaceOrder = () => {
    setOrderNumber(`CC-${Date.now().toString(36).toUpperCase()}`);
    setStep('confirmed');
    setTimeout(() => {
      clearCart();
      setPromoApplied(false);
      setPromoCode('');
      setShipping({ name: '', email: '', address: '', city: '', zip: '' });
      setPayment({ cardNumber: '', expiry: '', cvc: '', nameOnCard: '' });
      setTimeout(() => {
        setStep('cart');
        onClose();
      }, 2000);
    }, 3500);
  };

  const stepIndex = { cart: 0, shipping: 1, payment: 2, confirmed: 3 };

  if (!mounted) return null;

  const content = (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-background shadow-2xl border-l border-border flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {step === 'confirmed' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Order Confirmed!</h2>
            <p className="text-sm text-muted-foreground mb-4">Your order has been placed successfully.</p>
            <div className="bg-muted rounded-xl px-6 py-3 mb-3">
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="text-lg font-mono font-bold text-foreground">{orderNumber}</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{fmt(orderTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Confirmation sent to {shipping.email}</p>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Closing...
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {step === 'cart' && 'Your Cart'}
                  {step === 'shipping' && 'Shipping'}
                  {step === 'payment' && 'Payment'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Steps */}
              {items.length > 0 && (
                <div className="flex items-center gap-1">
                  {['Cart', 'Shipping', 'Payment'].map((label, i) => (
                    <div key={label} className="flex-1 flex items-center gap-1">
                      <div className="flex-1">
                        <div className={`h-1 rounded-full transition-colors duration-300 ${i <= stepIndex[step] ? 'bg-primary' : 'bg-muted'}`} />
                        <p className={`text-[10px] mt-1 font-medium ${i <= stepIndex[step] ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* ===== CART STEP ===== */}
              {step === 'cart' && (
                <div className="p-6">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                      <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="font-medium">Your cart is empty</p>
                      <p className="text-sm mt-1">Start adding some items!</p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-4 mb-6">
                        {items.map(item => (
                          <li key={item.id} className="flex gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center border border-border rounded-lg">
                                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs">-</button>
                                  <span className="w-6 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs">+</button>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-foreground tabular-nums">{fmt(item.price * item.quantity)}</p>
                          </li>
                        ))}
                      </ul>

                      {/* Promo Code */}
                      <div className="border border-border rounded-xl p-3 mb-6">
                        <p className="text-xs font-medium text-foreground mb-2">Promo Code</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter code"
                            disabled={promoApplied}
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          />
                          {promoApplied ? (
                            <span className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              Applied
                            </span>
                          ) : (
                            <button onClick={handleApplyPromo} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors">
                              Apply
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Try &quot;SAVE10&quot; for 10% off</p>
                      </div>

                      {/* Summary */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal ({totalItems} items)</span>
                          <span>{fmt(totalPrice)}</span>
                        </div>
                        {promoApplied && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Promo (10% off)</span>
                            <span>-{fmt(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">Free</span> : fmt(shippingCost)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax</span>
                          <span>{fmt(tax)}</span>
                        </div>
                        <div className="flex justify-between text-foreground font-bold text-base pt-2 border-t border-border">
                          <span>Total</span>
                          <span>{fmt(orderTotal)}</span>
                        </div>
                        {totalPrice < FREE_SHIPPING_THRESHOLD && (
                          <p className="text-[10px] text-muted-foreground text-center pt-1">
                            Add {fmt(FREE_SHIPPING_THRESHOLD - totalPrice)} more for free shipping
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ===== SHIPPING STEP ===== */}
              {step === 'shipping' && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                    <input type="text" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="Jane Smith" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                    <input type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} placeholder="jane@example.com" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Address</label>
                    <input type="text" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="123 Main Street" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">City</label>
                      <input type="text" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="New York" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">ZIP Code</label>
                      <input type="text" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="10001" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                    </div>
                  </div>

                  {/* Delivery estimate */}
                  <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3 mt-2">
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-foreground">Standard Delivery</p>
                      <p className="text-xs text-muted-foreground">Estimated 3-5 business days</p>
                      <p className="text-xs font-medium text-primary mt-1">{shippingCost === 0 ? 'Free' : fmt(shippingCost)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== PAYMENT STEP ===== */}
              {step === 'payment' && (
                <div className="p-6 space-y-4">
                  {/* Order summary mini */}
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2 mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Ship to</span>
                      <span className="font-medium text-foreground">{shipping.name}, {shipping.city} {shipping.zip}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Items</span>
                      <span className="font-medium text-foreground">{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                      <span>Total</span>
                      <span>{fmt(orderTotal)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Name on Card</label>
                    <input type="text" value={payment.nameOnCard} onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })} placeholder="Jane Smith" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Card Number</label>
                    <input type="text" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })} placeholder="4242 4242 4242 4242" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Expiry</label>
                      <input type="text" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">CVC</label>
                      <input type="text" value={payment.cvc} onChange={(e) => setPayment({ ...payment, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring outline-none font-mono" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secured with SSL encryption. We never store your card details.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-3">
                {step === 'cart' && (
                  <>
                    <button onClick={() => setStep('shipping')} className="w-full py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all">
                      Continue to Shipping
                    </button>
                    <button onClick={clearCart} className="w-full py-2 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Clear Cart
                    </button>
                  </>
                )}
                {step === 'shipping' && (
                  <div className="flex gap-3">
                    <button onClick={() => setStep('cart')} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-accent transition-colors">
                      Back
                    </button>
                    <button onClick={() => setStep('payment')} disabled={!isShippingValid} className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Continue
                    </button>
                  </div>
                )}
                {step === 'payment' && (
                  <div className="flex gap-3">
                    <button onClick={() => setStep('shipping')} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-accent transition-colors">
                      Back
                    </button>
                    <button onClick={handlePlaceOrder} disabled={!isPaymentValid} className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Pay {fmt(orderTotal)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
