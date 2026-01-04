
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  sizes?: string[];
  inStock: boolean;
}

const products: Product[] = [
  {
    id: 1,
    name: 'Ukrainian Thunder Jersey #17',
    category: 'Jerseys',
    price: 89.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=500&fit=crop',
    badge: 'BESTSELLER',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true
  },
  {
    id: 2,
    name: 'Plotnytskyi Signature Tee',
    category: 'T-Shirts',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 3,
    name: 'Ukraine Volleyball Hoodie',
    category: 'Hoodies',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true
  },
  {
    id: 4,
    name: 'Champion Training Shorts',
    category: 'Shorts',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 5,
    name: 'Autographed Volleyball',
    category: 'Collectibles',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=500&fit=crop',
    badge: 'LIMITED',
    inStock: true
  },
  {
    id: 6,
    name: 'Ukrainian Thunder Cap',
    category: 'Accessories',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=500&fit=crop',
    inStock: true
  },
  {
    id: 7,
    name: 'Pro Training Backpack',
    category: 'Accessories',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    badge: 'SALE',
    inStock: true
  },
  {
    id: 8,
    name: 'Perugia Away Jersey Replica',
    category: 'Jerseys',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop',
    sizes: ['M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 9,
    name: 'Gold & Blue Wristbands Set',
    category: 'Accessories',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop',
    inStock: true
  },
  {
    id: 10,
    name: 'Championship Poster Print',
    category: 'Collectibles',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?w=400&h=500&fit=crop',
    inStock: true
  },
  {
    id: 11,
    name: 'Training Compression Shirt',
    category: 'T-Shirts',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 12,
    name: 'MVP Water Bottle',
    category: 'Accessories',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=500&fit=crop',
    inStock: false
  }
];

const categories = ['All', 'Jerseys', 'T-Shirts', 'Hoodies', 'Shorts', 'Accessories', 'Collectibles'];

export const Shop: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{ product: Product; quantity: number; size?: string }[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product, size?: string) => {
    if (!product.inStock) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === size);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size }];
    });
  };

  const removeFromCart = (productId: number, size?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 md:px-14 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gold flex items-center justify-center font-bebas text-slate-950 text-xl">
              17
            </div>
            <span className="font-bebas text-2xl text-white group-hover:text-gold transition-colors">
              PLOTNYTSKYI
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="font-barlow font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider text-sm"
            >
              Back to Home
            </Link>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 text-white hover:text-gold transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bebas text-[30vw] text-white/5 whitespace-nowrap">
            SHOP
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-14 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-gold/20 text-gold font-barlow font-bold tracking-[0.2em] uppercase text-sm mb-6">
            Official Merchandise
          </span>
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            THE <span className="text-gold">COLLECTION</span>
          </h1>
          <p className="font-inter text-slate-400 max-w-xl mx-auto text-lg">
            Wear your support. Premium merchandise inspired by the Ukrainian Thunder himself.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-white/10 sticky top-[73px] bg-slate-950/95 backdrop-blur-md z-40">
        <div className="container mx-auto px-6 md:px-14">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 font-barlow font-bold uppercase tracking-wider text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-gold text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="font-inter text-slate-400 text-lg">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-900 border-t border-white/10">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">Free Shipping</h3>
              <p className="font-inter text-slate-400 text-sm">On orders over $75</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">Authentic Gear</h3>
              <p className="font-inter text-slate-400 text-sm">Official licensed merchandise</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">Easy Returns</h3>
              <p className="font-inter text-slate-400 text-sm">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6 md:px-14 text-center">
          <p className="font-inter text-slate-500 text-sm">
            &copy; 2025 Plotnytskyi Collection. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bebas text-3xl text-white">Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-inter text-slate-400">Your cart is empty</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-4 px-6 py-2 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart.map((item, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-slate-800 border border-white/10">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-bebas text-lg text-white">{item.product.name}</h3>
                          {item.size && (
                            <p className="text-slate-400 text-sm">Size: {item.size}</p>
                          )}
                          <p className="text-gold font-bold">${item.product.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bebas text-2xl text-white">Total</span>
                      <span className="font-bebas text-3xl text-gold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button className="w-full py-4 bg-gold text-slate-950 font-barlow font-extrabold uppercase tracking-wider hover:bg-white transition-colors">
                      Checkout
                    </button>
                    <p className="text-center text-slate-500 text-sm mt-4">
                      This is a demo store. No real transactions.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (product: Product, size?: string) => void;
}> = ({ product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 border border-white/10 mb-4">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />

        {/* Badges */}
        {product.badge && (
          <span className={`absolute top-3 left-3 px-3 py-1 font-barlow font-bold text-xs uppercase tracking-wider ${
            product.badge === 'SALE' ? 'bg-red-500 text-white' :
            product.badge === 'LIMITED' ? 'bg-purple-500 text-white' :
            'bg-gold text-slate-950'
          }`}>
            {product.badge}
          </span>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
            <span className="font-bebas text-2xl text-slate-400">SOLD OUT</span>
          </div>
        )}

        {/* Quick Add Overlay */}
        {product.inStock && (
          <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {product.sizes && (
              <div className="flex gap-2 mb-3 justify-center">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-9 h-9 font-barlow font-bold text-xs transition-all ${
                      selectedSize === size
                        ? 'bg-gold text-slate-950'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => onAddToCart(product, selectedSize)}
              className="w-full py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <span className="font-barlow text-ukraine-blue text-xs uppercase tracking-widest">{product.category}</span>
        <h3 className="font-bebas text-xl text-white mt-1 group-hover:text-gold transition-colors">{product.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="font-bebas text-2xl text-gold">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="font-inter text-slate-500 line-through text-sm">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
