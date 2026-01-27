
import React from "react";
import type { HomeMessages } from "@/lib/i18n";

type StatsProps = {
  copy: HomeMessages["stats"];
};

export const Stats: React.FC<StatsProps> = ({ copy }) => {
  return (
    <section className="container mx-auto px-6 md:px-14 relative z-20 -mt-16 reveal opacity-0 translate-y-10 transition-all duration-1000">
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white/10 p-0.5 border border-white/10 shadow-2xl">
        {copy.items.map((stat, i) => (
          <div 
            key={i} 
            className="bg-slate-900 p-10 flex flex-col items-center justify-center group hover:bg-ukraine-darker hover:-translate-y-2 transition-all duration-300 cursor-default"
          >
            <span className="font-bebas text-6xl md:text-7xl text-gold leading-none group-hover:scale-110 transition-transform">
              {stat.value}
            </span>
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-400 text-sm mt-4 group-hover:text-white">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
