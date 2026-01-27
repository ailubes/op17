import React from "react";
import type { HomeMessages } from "@/lib/i18n";

const careerMedia = [
  { image: "/images/oleh-portrait.jpg", side: "left" },
  { image: "/images/oleh-action-1.jpg", side: "right" },
  { image: "/images/oleh-action-2.jpg", side: "left" },
  { image: "/images/oleh-wikipedia.jpg", side: "right" },
  { image: "/images/oleh-action-3.jpg", side: "left" },
  { image: "/images/oleh-attack.jpg", side: "right" },
  { image: "/images/oleh-mvp.jpg", side: "left" },
  { image: "/images/oleh-celebration.jpg", side: "right" },
  { image: "/images/oleh-portrait.jpg", side: "left" },
];

type CareerTimelineProps = {
  copy: HomeMessages["career"];
};

export const CareerTimeline: React.FC<CareerTimelineProps> = ({ copy }) => {
  const careerData = copy.timeline.map((entry, index) => ({
    ...entry,
    image: careerMedia[index]?.image || "/images/oleh-portrait.jpg",
    side: careerMedia[index]?.side || "left",
  }));

  return (
    <section id="career" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-ukraine-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-14">
        <div className="text-center mb-32 reveal opacity-0 translate-y-10 transition-all duration-1000">
          <h2 className="font-bebas text-6xl md:text-8xl mb-4 uppercase tracking-tight">
            {copy.titleLead} <span className="text-gold">{copy.titleHighlight}</span>
            {copy.titleSuffix ? ` ${copy.titleSuffix}` : ""}
          </h2>
          <div className="w-24 h-1 bg-ukraine-blue mx-auto mb-6"></div>
          <p className="font-inter text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Central Vertical Line with Gradient */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ukraine-blue via-gold to-ukraine-blue hidden md:block"></div>

          <div className="space-y-32 relative">
            {careerData.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center justify-between w-full reveal opacity-0 translate-y-10 transition-all duration-1000 ${
                  item.side === "right" ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image Side */}
                <div className="w-full md:w-[45%] group perspective-1000">
                  <div className="relative aspect-video overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02] group-hover:border-gold/30">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-4 left-4 font-bebas text-4xl text-white/50">
                      {item.year}
                    </div>
                  </div>
                </div>

                {/* Central Point Icon */}
                <div className="relative flex items-center justify-center my-12 md:my-0 z-20">
                  <div className="w-5 h-5 rounded-full bg-gold border-4 border-slate-950 shadow-[0_0_20px_rgba(255,213,0,0.8)]"></div>
                  <div className="absolute w-12 h-12 rounded-full border border-gold/20 animate-ping"></div>
                </div>

                {/* Text Side */}
                <div className="w-full md:w-[45%]">
                  <div
                    className={`p-2 transition-all duration-500 ${
                      item.side === "left" ? "md:text-left" : "md:text-right"
                    }`}
                  >
                    <span className="font-bebas text-gold text-2xl tracking-widest mb-2 block">
                      {item.year}
                    </span>
                    <h3 className="font-bebas text-4xl md:text-5xl uppercase mb-6 tracking-wide text-white group-hover:text-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-inter text-slate-400 leading-relaxed text-lg max-w-xl inline-block">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics CTA */}
        <div className="mt-40 text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
          <div className="inline-block relative p-12 bg-slate-900 border border-white/5 overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 font-bebas text-9xl text-white/[0.03] select-none leading-none">MVP</div>

            <h4 className="font-bebas text-5xl mb-8 relative z-10">
              {copy.ctaTitleLead} <span className="text-gold">{copy.ctaTitleHighlight}</span>
            </h4>
            <div className="flex flex-wrap justify-center gap-12 relative z-10">
              {copy.ctaStats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  <div className="text-center">
                    <div className="font-bebas text-5xl text-gold">{stat.value}</div>
                    <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-sm">
                      {stat.label}
                    </div>
                  </div>
                  {index < copy.ctaStats.length - 1 && (
                    <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-12 relative z-10">
              <button className="px-10 py-4 bg-gold text-slate-950 font-barlow font-extrabold uppercase tracking-widest clip-btn hover:bg-white transition-all transform hover:-translate-y-1">
                {copy.ctaButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
