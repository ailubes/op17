
import React from 'react';

const familyMembers = [
  {
    name: 'Anna Plotnytska',
    role: 'Wife',
    description: 'Married on June 23, 2021. Anna has been Oleh\'s rock through championships and challenges alike.',
    icon: '💕'
  },
  {
    name: 'Sviatoslav',
    role: 'Son',
    description: 'Born July 9, 2021. Already showing his father\'s competitive spirit and love for sports.',
    icon: '👶'
  },
  {
    name: 'Maria',
    role: 'Daughter',
    description: 'Born June 25, 2025. The newest addition to the Plotnytskyi family.',
    icon: '👧'
  }
];

const familyTimeline = [
  { date: 'June 7, 2019', event: 'Engagement', icon: '💍' },
  { date: 'June 23, 2021', event: 'Wedding Day', icon: '💒' },
  { date: 'July 9, 2021', event: 'Sviatoslav Born', icon: '👶' },
  { date: 'June 25, 2025', event: 'Maria Born', icon: '🎀' }
];

export const Family: React.FC = () => {
  return (
    <section id="family" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-14">
        {/* Header */}
        <div className="text-center mb-20 reveal opacity-0 translate-y-10 transition-all duration-1000">
          <span className="inline-block px-4 py-2 bg-gold/20 text-gold font-barlow font-bold tracking-[0.2em] uppercase text-sm mb-6">
            The Heart Behind The Thunder
          </span>
          <h2 className="font-bebas text-6xl md:text-8xl mb-6 leading-none">
            THE <span className="text-gold">PLOTNYTSKYI</span> FAMILY
          </h2>
          <p className="font-inter text-slate-400 max-w-2xl mx-auto text-lg">
            Behind every great champion is a loving family. Meet the people who inspire Oleh to greatness every day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Volleyball Heritage */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
            <div className="bg-slate-900 border border-white/10 p-8 mb-8">
              <h3 className="font-bebas text-4xl text-white mb-6">
                A <span className="text-ukraine-blue">Volleyball Dynasty</span>
              </h3>
              <div className="space-y-6 font-inter text-slate-300 leading-relaxed">
                <p>
                  Volleyball runs in the Plotnytskyi blood. Both of Oleh's parents —
                  <strong> Yurii</strong> and <strong>Oksana</strong> — were passionate volleyball players.
                  Growing up in Letkivka, there was never a question about what sport young Oleh would pursue.
                </p>
                <p>
                  <em>"My mom and dad played volleyball, so I did not have a choice,"</em> Oleh once reflected
                  with a smile. At just six years old, he began training under his father's guidance at a
                  local sports school in Khmelnytskyi, learning the fundamentals that would one day make him
                  a world champion.
                </p>
                <p>
                  This volleyball heritage instilled in Oleh not just technical skills, but the discipline,
                  work ethic, and competitive fire that defines his play. The family legacy continues as
                  he now passes these values to his own children.
                </p>
              </div>

              {/* Parents */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="font-barlow font-bold text-gold uppercase tracking-widest text-sm mb-4">Parents</h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-ukraine-blue/20 flex items-center justify-center text-xl">🏐</div>
                    <div>
                      <div className="font-bebas text-xl text-white">Yurii Plotnytskyi</div>
                      <div className="text-slate-400 text-sm">Father & First Coach</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-xl">🏐</div>
                    <div>
                      <div className="font-bebas text-xl text-white">Oksana Plotnytska-Lisohor</div>
                      <div className="text-slate-400 text-sm">Mother & Volleyball Player</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Timeline */}
            <div className="bg-slate-900 border border-white/10 p-8">
              <h3 className="font-bebas text-3xl text-white mb-6">Family Milestones</h3>
              <div className="space-y-4">
                {familyTimeline.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-lg shrink-0 group-hover:bg-gold/40 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bebas text-xl text-white group-hover:text-gold transition-colors">{item.event}</div>
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
                alt="The Plotnytskyi Family"
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6">
                <div className="font-bebas text-3xl text-white">#PlotnytskyiFamily</div>
                <div className="text-slate-300 text-sm">Follow on Instagram: @oleh_anna_family</div>
              </div>
            </div>

            {/* Family Photo Gallery */}
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-2.jpg"
                  alt="Oleh with family"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-3.jpg"
                  alt="Family moment"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-4.jpg"
                  alt="Family celebration"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Mom Photos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/3] overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-mom-5.jpg"
                  alt="Oleh with his mother"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family-mom-6.jpg"
                  alt="Family heritage"
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
                      <h4 className="font-bebas text-2xl text-white group-hover:text-gold transition-colors">{member.name}</h4>
                      <span className="px-2 py-0.5 bg-ukraine-blue/30 text-ukraine-blue font-barlow font-bold text-xs uppercase tracking-wider">
                        {member.role}
                      </span>
                    </div>
                    <p className="font-inter text-slate-400 text-sm leading-relaxed">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Family Quote */}
            <div className="bg-gold text-slate-950 p-6">
              <p className="font-inter text-sm italic leading-relaxed">
                "Family gives me strength. When I step on the court, I carry their love with me.
                Every point, every victory — it's for them."
              </p>
              <div className="font-bebas text-lg mt-3">— Oleh Plotnytskyi</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
