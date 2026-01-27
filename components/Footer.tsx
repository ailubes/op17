
import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 pt-32 pb-14 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-8 inline-flex items-center gap-3 group">
              <img
                src="/images/logos/blue-yellow.png"
                alt="Oleh Plotnytskyi OP17 logo"
                className="h-12 md:h-14 w-auto transition-transform group-hover:scale-105"
              />
              <span className="sr-only">OP17</span>
            </Link>
            <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
              The official digital home of Oleh Plotnytskyi. 
              Celebrating excellence in volleyball and the indomitable spirit of the Ukrainian people.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/oleh_plotnytskyi/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:border-gold hover:text-gold transition-all"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://volleybox.net/oleh-plotnytskyi-p10543"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:border-gold hover:text-gold transition-all"
                aria-label="Volleybox Profile"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </a>
              <a
                href="https://en.wikipedia.org/wiki/Oleh_Plotnytskyi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:border-gold hover:text-gold transition-all"
                aria-label="Wikipedia"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-barlow font-bold uppercase tracking-widest mb-8 text-white">Quick Links</h4>
            <ul className="space-y-4 font-inter text-slate-400">
              {['About Oleh', 'Career Highlights', 'Fan Zone', 'Privacy Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-gold transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-barlow font-bold uppercase tracking-widest mb-8 text-white">Newsletter</h4>
            <p className="text-slate-400 text-sm mb-6">Join the thunder. Get exclusive updates and drop alerts.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold flex-1 transition-colors"
              />
              <button className="bg-gold text-slate-950 px-6 font-bebas text-xl hover:bg-white transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-inter">
          <p>&copy; {new Date().getFullYear()} Oleh Plotnytskyi. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-barlow font-bold tracking-[0.2em] text-gold text-lg">СЛАВА УКРАЇНІ! 🇺🇦</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
