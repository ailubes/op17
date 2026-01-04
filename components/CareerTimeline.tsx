
import React from 'react';

const careerData = [
  {
    year: '1997',
    title: 'Letkivka Origins',
    description: 'Born on June 5, 1997, in Letkivka village, Vinnytsia Oblast, Ukraine. Both parents were volleyball players, and Oleh began playing at age 6 under his father\'s guidance.',
    image: '/images/oleh-portrait.jpg',
    side: 'left'
  },
  {
    year: '2016',
    title: 'European MVP',
    description: 'Named MVP and Best Outside Spiker at the U20 European Championship in Plovdiv. Led a legendary comeback against Italy with a historic service streak, winning silver for Ukraine.',
    image: '/images/oleh-action-1.jpg',
    side: 'right'
  },
  {
    year: '2017',
    title: 'The Italian Dream',
    description: 'Made his national team debut on May 24. Transferred from Lokomotyv Kharkiv to Vero Volley Monza, entering the world\'s toughest league with his fearless left-handed attack.',
    image: '/images/oleh-action-2.jpg',
    side: 'left'
  },
  {
    year: '2018',
    title: 'National Captain',
    description: 'Named captain of the Ukraine national team at just 21 years old. A leader on and off the court, embodying the resilience and fighting spirit of his nation.',
    image: '/images/oleh-wikipedia.jpg',
    side: 'right'
  },
  {
    year: '2019',
    title: 'Joining Perugia',
    description: 'Transferred to Sir Safety Perugia. Joining one of the "Big Four" of Italian volleyball, Plotnytskyi secured his spot among the global elite and began winning titles.',
    image: '/images/oleh-action-3.jpg',
    side: 'left'
  },
  {
    year: '2022',
    title: 'World Championship Hero',
    description: 'Led Ukraine to a historic 7th place at the World Championship - the nation\'s best result since independence. Named Best Server of the tournament.',
    image: '/images/oleh-attack.jpg',
    side: 'right'
  },
  {
    year: '2023',
    title: 'Club World MVP',
    description: 'Crowned MVP of the Club World Championship. Leading Perugia to back-to-back global titles and cementing his legacy as a world-class finisher.',
    image: '/images/oleh-mvp.jpg',
    side: 'left'
  },
  {
    year: '2024',
    title: 'Golden League & Triple Crown',
    description: 'Won the CEV European Golden League with Ukraine. In Italy: Scudetto, Coppa Italia (MVP), and Supercoppa. The "Beast" dominates on all fronts.',
    image: '/images/oleh-celebration.jpg',
    side: 'right'
  },
  {
    year: '2025',
    title: 'National Team Farewell',
    description: 'In March 2025, Oleh announced his emotional retirement from the Ukraine national team after 8 years as captain. His legacy: historic achievements and inspiration for a nation.',
    image: '/images/oleh-portrait.jpg',
    side: 'left'
  }
];

export const CareerTimeline: React.FC = () => {
  return (
    <section id="career" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-ukraine-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-14">
        <div className="text-center mb-32 reveal opacity-0 translate-y-10 transition-all duration-1000">
          <h2 className="font-bebas text-6xl md:text-8xl mb-4 uppercase tracking-tight">
            The <span className="text-gold">Thunder</span> Timeline
          </h2>
          <div className="w-24 h-1 bg-ukraine-blue mx-auto mb-6"></div>
          <p className="font-inter text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            From a talented kid in Vinnytsia to the MVP of the world. Witness the historic rise of Ukraine's greatest volleyball export.
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
                  item.side === 'right' ? 'md:flex-row-reverse' : ''
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
                      <div className="absolute bottom-4 left-4 font-bebas text-4xl text-white/50">{item.year}</div>
                   </div>
                </div>

                {/* Central Point Icon */}
                <div className="relative flex items-center justify-center my-12 md:my-0 z-20">
                  <div className="w-5 h-5 rounded-full bg-gold border-4 border-slate-950 shadow-[0_0_20px_rgba(255,213,0,0.8)]"></div>
                  <div className="absolute w-12 h-12 rounded-full border border-gold/20 animate-ping"></div>
                </div>

                {/* Text Side */}
                <div className="w-full md:w-[45%]">
                  <div className={`p-2 transition-all duration-500 ${
                    item.side === 'left' ? 'md:text-left' : 'md:text-right'
                  }`}>
                    <span className="font-bebas text-gold text-2xl tracking-widest mb-2 block">{item.year}</span>
                    <h3 className="font-bebas text-4xl md:text-5xl uppercase mb-6 tracking-wide text-white group-hover:text-gold transition-colors">{item.title}</h3>
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
             
             <h4 className="font-bebas text-5xl mb-8 relative z-10">Legendary <span className="text-gold">Accolades</span></h4>
             <div className="flex flex-wrap justify-center gap-12 relative z-10">
                <div className="text-center">
                   <div className="font-bebas text-5xl text-gold">11+</div>
                   <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-sm">Major Titles</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                   <div className="font-bebas text-5xl text-gold">8</div>
                   <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-sm">Years Captain</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                   <div className="font-bebas text-5xl text-gold">2X</div>
                   <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-sm">World Champion</div>
                </div>
             </div>
             
             <div className="mt-12 relative z-10">
               <button className="px-10 py-4 bg-gold text-slate-950 font-barlow font-extrabold uppercase tracking-widest clip-btn hover:bg-white transition-all transform hover:-translate-y-1">
                 Download Full Stats (PDF)
               </button>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};
