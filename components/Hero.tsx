
import React from 'react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center overflow-hidden pt-20 bg-slate-950">
      {/* Background Subtle Texture */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.02] grayscale pointer-events-none"
        style={{ 
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
        }}
      ></div>

      {/* Background Decorative Text */}
      <div className="absolute bottom-[-10%] left-[-5%] font-bebas text-[40vw] leading-[0.8] text-white/[0.02] z-0 pointer-events-none select-none whitespace-nowrap">
        PLOTNYTSKYI
      </div>

      <div className="container mx-auto px-6 md:px-14 flex items-center relative z-10 w-full">
        <div className="w-full lg:w-1/2">
          <span className="inline-block px-4 py-2 bg-ukraine-blue text-white font-barlow font-bold tracking-[0.2em] uppercase clip-tag mb-6 animate-fadeIn">
            Ukrainian Thunder
          </span>
          <h1 className="font-bebas text-[80px] md:text-[140px] leading-[0.9] uppercase mb-10">
            <span className="block animate-slideUp">The Be<span className="relative inline-block"><img src="/images/volleyball-ball-svgrepo-com.svg" alt="" className="hidden md:block absolute -top-[0.7em] left-1/2 -translate-x-1/2 w-[0.55em] h-[0.55em] drop-shadow-[0_0_15px_rgba(255,213,0,0.9)]" />a</span>st</span>
            <span className="block outline-text animate-slideUp delay-200">From</span>
            <span className="block text-gold animate-slideUp delay-400">Ukraine</span>
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-10 animate-fadeIn delay-500">
            <Link
              to="/shop"
              className="px-8 py-4 bg-gold text-slate-950 font-barlow font-extrabold uppercase tracking-wider clip-btn hover:bg-white hover:scale-105 transition-all shadow-xl inline-block"
            >
              Explore Collection
            </Link>
            <a href="#athlete" className="font-barlow font-semibold uppercase tracking-[0.15em] text-white border-b-2 border-ukraine-blue hover:text-gold transition-colors">
              Full Story
            </a>
          </div>
        </div>
      </div>

      {/* Hero Image Monolith - Right Side */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[80vh] z-10 hidden lg:block">
        <div className="w-full h-full bg-slate-900 clip-hero border-l-4 border-gold overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          
          {/* Ambient Radiant Glow - Background Layer (z-0) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,_rgba(255,213,0,0.2)_0%,_transparent_70%)] z-0"></div>
          
          {/* Subtle Color Grading Gradients - Background Layer (z-0) */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent opacity-60 z-0 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 z-0 pointer-events-none"></div>
          
          {/* Action Silhouette Treatment - Foreground Layer (z-20) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-20 z-20">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src="/images/plotnyskyi-hero-bg.png" 
                alt="Oleh Plotnytskyi Silhouette"
                className="h-[85%] w-auto object-contain transition-all duration-1000"
                style={{
                  filter: `
                    brightness(0) 
                    invert(1)
                    drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) 
                    drop-shadow(0 0 50px rgba(255, 213, 0, 0.8)) 
                    drop-shadow(0 0 100px rgba(255, 213, 0, 0.5))
                  `,
                  animation: 'star-glow 3s ease-in-out infinite alternate'
                }}
              />
              
              {/* Star/Sparkle Particles */}
              <div className="absolute top-[20%] right-[30%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-60"></div>
              <div className="absolute bottom-[25%] right-[20%] w-1 h-1 bg-gold rounded-full animate-pulse delay-700 shadow-[0_0_10px_#FFD500]"></div>
              <div className="absolute top-[40%] right-[10%] w-1 h-1 bg-ukraine-blue rounded-full animate-pulse delay-1000 shadow-[0_0_10px_#005BBB]"></div>
              <div className="absolute top-[10%] right-[45%] w-0.5 h-0.5 bg-white rounded-full animate-ping delay-300"></div>
            </div>
          </div>
          
          {/* Decorative Jersey Number - Background Layer (z-10) */}
          <div className="absolute bottom-10 left-0 p-12 w-full text-right pointer-events-none z-10">
            <span className="font-bebas text-[10rem] text-white/[0.03] block select-none leading-none">17</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes star-glow {
          0% {
            transform: scale(1);
            filter: brightness(0) invert(1) drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 30px rgba(255, 213, 0, 0.6)) drop-shadow(0 0 60px rgba(255, 213, 0, 0.3));
          }
          100% {
            transform: scale(1.02);
            filter: brightness(0) invert(1) drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 60px rgba(255, 213, 0, 0.9)) drop-shadow(0 0 120px rgba(255, 213, 0, 0.6));
          }
        }
      `}</style>
    </section>
  );
};
