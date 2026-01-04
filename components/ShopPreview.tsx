
import React from 'react';

const products = [
  {
    id: 1,
    title: 'Thunder Match Jersey 24/25',
    price: '€89.00',
    type: 'jersey'
  },
  {
    id: 2,
    title: '"The Beast" Essential Hoodie',
    price: '€65.00',
    type: 'hoodie'
  },
  {
    id: 3,
    title: 'Signed Limited Edition Ball',
    price: '€120.00',
    type: 'ball'
  }
];

export const ShopPreview: React.FC = () => {
  return (
    <section className="py-32 px-6 md:px-14 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14">
        <div>
          <h2 className="font-bebas text-6xl tracking-wider mb-2 reveal opacity-0 translate-y-10 transition-all duration-1000">
            Exclusive <span className="text-ukraine-blue">Gear</span>
          </h2>
          <p className="text-slate-400 font-inter max-w-lg reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            High-performance apparel designed for the thunder. 
            Rep the pride of Ukraine on and off the court.
          </p>
        </div>
        <a href="#" className="font-barlow font-bold text-slate-300 uppercase tracking-widest mt-6 md:mt-0 group flex items-center gap-2 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
          View All Items <span className="group-hover:translate-x-2 transition-transform">→</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="reveal opacity-0 translate-y-10 transition-all duration-1000 bg-slate-900 border border-white/5 p-6 group relative overflow-hidden flex flex-col"
          >
            {/* Hover bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
            
            <div className="aspect-square bg-slate-800/50 mb-6 flex items-center justify-center relative overflow-hidden">
                <div className="group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700">
                    {/* Placeholder illustration SVGs */}
                    {product.type === 'jersey' && (
                        <svg width="180" height="220" viewBox="0 0 180 220" fill="none" className="drop-shadow-2xl">
                            <path d="M40 20L20 60V200H160V60L140 20H40Z" fill="#003D7A"/>
                            <rect x="85" y="80" width="10" height="60" fill="#FFD500"/>
                            <text x="45" y="140" fill="white" className="font-bebas text-[60px]">17</text>
                        </svg>
                    )}
                    {product.type === 'hoodie' && (
                        <svg width="180" height="220" viewBox="0 0 180 220" fill="none" className="drop-shadow-2xl">
                            <path d="M30 40C30 40 50 10 90 10C130 10 150 40 150 40L170 80V200H10V80L30 40Z" fill="#1E293B"/>
                            <path d="M70 110L90 130L110 110" stroke="#FFD500" strokeWidth="4"/>
                            <text x="55" y="170" fill="rgba(255,255,255,0.2)" className="font-bebas text-[30px]">THUNDER</text>
                        </svg>
                    )}
                    {product.type === 'ball' && (
                         <div className="w-40 h-40 bg-gold rounded-full relative shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-950/20"></div>
                            <span className="font-bebas text-slate-900 text-xl rotate-[-10deg] font-bold">Plotnytskyi</span>
                         </div>
                    )}
                </div>
            </div>

            <h3 className="font-barlow font-bold text-2xl uppercase mb-4">{product.title}</h3>
            <div className="flex justify-between items-center mt-auto">
                <span className="font-bebas text-3xl text-gold">{product.price}</span>
                <button className="px-4 py-2 border border-gold text-gold font-barlow font-bold uppercase hover:bg-gold hover:text-slate-950 transition-all">
                    Add +
                </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
