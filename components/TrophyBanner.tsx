import React from "react";
import type { HomeMessages } from "@/lib/i18n";

type TrophyBannerProps = {
  copy: HomeMessages["trophy"];
};

export const TrophyBanner: React.FC<TrophyBannerProps> = ({ copy }) => {
  return (
    <section className="bg-ukraine-blue py-20 relative overflow-hidden">
      {/* Decorative Lines */}
      <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
      <div className="absolute bottom-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>

      <div className="container mx-auto px-6 md:px-14 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1">
          <h2 className="font-bebas text-7xl md:text-[100px] text-ukraine-darker leading-none select-none">
            {copy.marquee}
          </h2>
        </div>
        <div className="bg-gold text-slate-950 px-10 py-6 font-bebas text-4xl rotate-[3deg] shadow-2xl transform hover:rotate-0 transition-transform duration-500 cursor-default shrink-0">
          {copy.clubName}
        </div>
      </div>
    </section>
  );
};
