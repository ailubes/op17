
import React from "react";
import type { HomeMessages } from "@/lib/i18n";

type AboutProps = {
  copy: HomeMessages["about"];
};

export const About: React.FC<AboutProps> = ({ copy }) => {
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
              <span className="font-bebas text-2xl">{copy.badge}</span>
            </div>
          </div>
          
          {/* Accent Box */}
          <div className="absolute -bottom-6 -right-6 w-48 h-48 border-r-4 border-b-4 border-gold z-[-1] hidden md:block"></div>
        </div>

        {/* Text Side */}
        <div className="reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
          <h2 className="font-bebas text-6xl md:text-7xl mb-8 leading-none">
            {copy.titleLead} <span className="text-gold">{copy.titleHighlight}</span>
          </h2>
          
          <div className="space-y-6 font-inter text-slate-300 text-lg leading-relaxed">
            {copy.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Bio Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-12 border-t border-white/10 pt-10">
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">
                {copy.bio.heightLabel}
              </span>
              <span className="font-bebas text-3xl">1.95 M</span>
            </div>
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">
                {copy.bio.spikeLabel}
              </span>
              <span className="font-bebas text-3xl">345 CM</span>
            </div>
            <div>
              <span className="block font-barlow font-bold text-gold uppercase tracking-wider text-sm mb-1">
                {copy.bio.bornLabel}
              </span>
              <span className="font-bebas text-3xl">1997</span>
            </div>
          </div>
          
          <div className="mt-12">
            <button className="px-10 py-4 border-2 border-white/20 font-barlow font-bold uppercase tracking-widest hover:border-gold hover:text-gold transition-all">
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
