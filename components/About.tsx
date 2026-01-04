
import React from 'react';

export const About: React.FC = () => {
  return (
    <section id="athlete" className="py-32 px-6 md:px-14 container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Visual Side */}
        <div className="relative reveal opacity-0 translate-y-10 transition-all duration-1000">
          <div className="aspect-[4/5] bg-slate-900 overflow-hidden border-2 border-ukraine-blue/30 relative group">
            <img 
              src="/images/oleh-wikipedia.jpg" 
              alt="Oleh Plotnytskyi action"
              className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
            
            {/* National Team Badge Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-3 bg-ukraine-blue/80 backdrop-blur-md px-4 py-2 clip-tag">
              <span className="font-bebas text-2xl">8-YEAR UKRAINE CAPTAIN</span>
            </div>
          </div>
          
          {/* Accent Box */}
          <div className="absolute -bottom-6 -right-6 w-48 h-48 border-r-4 border-b-4 border-gold z-[-1] hidden md:block"></div>
        </div>

        {/* Text Side */}
        <div className="reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
          <h2 className="font-bebas text-6xl md:text-7xl mb-8 leading-none">
            THE BEAST FROM <span className="text-gold">UKRAINE</span>
          </h2>
          
          <div className="space-y-6 font-inter text-slate-300 text-lg leading-relaxed">
            <p>
              Born on June 5, 1997, in Letkivka village, Vinnytsia Oblast, Ukraine, <strong>Oleh Plotnytskyi</strong> has risen to become one of the most formidable outside hitters in world volleyball. Standing at 1.95m (6 ft 5 in) with a 345cm spike reach, his explosive power and devastating left-handed serve have earned him the nickname "The Beast."
            </p>
            <p>
              From 2018 to 2025, Plotnytskyi served as captain of the Ukraine national team, leading his country to a historic 7th place at the 2022 World Championship and winning the 2024 CEV European Golden League. In March 2025, he announced his retirement from the national team after 8 years of dedicated service.
            </p>
            <p>
              Currently a cornerstone of the Italian giant <strong>Sir Sicoma Monini Perugia</strong>, Oleh's trophy cabinet includes 2x Club World Championships, 5x Supercoppa Italiana, 2x Coppa Italia, and the 2023 Club World Championship <strong>MVP</strong> award. Named Best Server at the 2022 World Championship.
            </p>
          </div>

          {/* Bio Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-12 border-t border-white/10 pt-10">
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">Height</span>
              <span className="font-bebas text-3xl">1.95 M</span>
            </div>
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">Spike Reach</span>
              <span className="font-bebas text-3xl">345 CM</span>
            </div>
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">Born</span>
              <span className="font-bebas text-3xl">1997</span>
            </div>
          </div>
          
          <div className="mt-12">
            <button className="px-10 py-4 border-2 border-white/20 font-barlow font-bold uppercase tracking-widest hover:border-gold hover:text-gold transition-all">
              Full Career History
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
