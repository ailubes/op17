
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full px-6 md:px-14 py-6 z-[1000] transition-all duration-300 flex justify-between items-center ${scrolled ? 'bg-slate-950/90 backdrop-blur-md shadow-2xl py-4' : 'bg-transparent'}`}>
      <a href="#" className="font-bebas text-3xl tracking-widest text-white flex items-center gap-2 group">
        OP<span className="text-gold group-hover:scale-110 transition-transform">17</span>
      </a>

      <div className="hidden lg:flex gap-10">
        {[
          { name: 'The Athlete', id: '#athlete' },
          { name: 'Family', id: '#family' },
          { name: 'Hobbies', id: '#hobbies' },
          { name: 'Career', id: '#career' },
          { name: 'Gallery', id: '#gallery' }
        ].map((link) => (
          <a
            key={link.name}
            href={link.id}
            className="font-barlow font-semibold text-sm uppercase tracking-[0.15em] text-slate-300 hover:text-gold transition-colors relative group"
          >
            {link.name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
          </a>
        ))}
        <Link
          to="/shop"
          className="font-barlow font-semibold text-sm uppercase tracking-[0.15em] text-gold hover:text-white transition-colors relative group"
        >
          Shop
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
        </Link>
      </div>

      <div>
        <Link to="/shop" className="font-barlow font-bold text-gold uppercase tracking-wider hover:text-white transition-colors">
          Shop Now
        </Link>
      </div>
    </nav>
  );
};
