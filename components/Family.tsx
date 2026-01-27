import React from "react";
import type { HomeMessages } from "@/lib/i18n";

const familyMemberIcons = ["💍", "👶", "👧"];
const familyTimelineIcons = ["💍", "💒", "👶", "🎀"];

type FamilyProps = {
  copy: HomeMessages["family"];
};

export const Family: React.FC<FamilyProps> = ({ copy }) => {
  const familyMembers = copy.members.map((member, index) => ({
    ...member,
    icon: familyMemberIcons[index] || "❤️",
  }));

  const familyTimeline = copy.timeline.map((item, index) => ({
    ...item,
    icon: familyTimelineIcons[index] || "•",
  }));

  return (
    <section id="family" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-14">
        {/* Header */}
        <div className="text-center mb-20 reveal opacity-0 translate-y-10 transition-all duration-1000">
          <span className="inline-block px-4 py-2 bg-gold/20 text-gold font-barlow font-bold tracking-[0.2em] uppercase text-sm mb-6">
            {copy.badge}
          </span>
          <h2 className="font-bebas text-6xl md:text-8xl mb-6 leading-none">
            {copy.titleLead} <span className="text-gold">{copy.titleHighlight}</span>
            {copy.titleSuffix ? ` ${copy.titleSuffix}` : ""}
          </h2>
          <p className="font-inter text-slate-400 max-w-2xl mx-auto text-lg">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Volleyball Heritage */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
            <div className="bg-slate-900 border border-white/10 p-8 mb-8">
              <h3 className="font-bebas text-4xl text-white mb-6">
                {copy.heritageTitleLead}{" "}
                <span className="text-ukraine-blue">{copy.heritageTitleHighlight}</span>
              </h3>
              <div className="space-y-6 font-inter text-slate-300 leading-relaxed">
                {copy.heritageParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Parents */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="font-barlow font-bold text-gold uppercase tracking-widest text-sm mb-4">
                  {copy.parentsTitle}
                </h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-ukraine-blue/20 flex items-center justify-center text-xl">
                      🏐
                    </div>
                    <div>
                      <div className="font-bebas text-xl text-white">{copy.parents[0]?.name}</div>
                      <div className="text-slate-400 text-sm">{copy.parents[0]?.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-xl">
                      🏐
                    </div>
                    <div>
                      <div className="font-bebas text-xl text-white">{copy.parents[1]?.name}</div>
                      <div className="text-slate-400 text-sm">{copy.parents[1]?.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Timeline */}
            <div className="bg-slate-900 border border-white/10 p-8">
              <h3 className="font-bebas text-3xl text-white mb-6">{copy.timelineTitle}</h3>
              <div className="space-y-4">
                {familyTimeline.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-lg shrink-0 group-hover:bg-gold/40 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bebas text-xl text-white group-hover:text-gold transition-colors">
                        {item.event}
                      </div>
                      <div className="text-slate-400 text-sm">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wife and Children */}
          <div className="space-y-6 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
            {/* Main Family Image */}
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10 group">
              <img
                src="/images/plotnytskyi-family.jpg"
                alt={copy.images.mainAlt}
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6">
                <div className="font-bebas text-3xl text-white">{copy.galleryTagline}</div>
                <div className="text-slate-300 text-sm">{copy.galleryHandle}</div>
              </div>
            </div>

            {/* Family Photo Gallery */}
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-2.jpg"
                  alt={copy.images.alt1}
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-3.jpg"
                  alt={copy.images.alt2}
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-4.jpg"
                  alt={copy.images.alt3}
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Mom Photos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/3] overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-mom-5.jpg"
                  alt={copy.images.momAlt1}
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-mom-6.jpg"
                  alt={copy.images.momAlt2}
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Family Members Cards */}
            <div className="grid grid-cols-1 gap-4">
              {familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-white/10 p-6 flex items-start gap-4 hover:border-gold/30 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-2xl shrink-0 group-hover:bg-gold/20 transition-colors">
                    {member.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bebas text-2xl text-white group-hover:text-gold transition-colors">
                        {member.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-ukraine-blue/30 text-ukraine-blue font-barlow font-bold text-xs uppercase tracking-wider">
                        {member.role}
                      </span>
                    </div>
                    <p className="font-inter text-slate-400 text-sm leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Family Quote */}
            <div className="bg-gold text-slate-950 p-6">
              <p className="font-inter text-sm italic leading-relaxed">{copy.quote}</p>
              <div className="font-bebas text-lg mt-3">{copy.quoteAuthor}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
