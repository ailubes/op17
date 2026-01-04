
import React from 'react';

export const Hobbies: React.FC = () => {
  return (
    <section id="hobbies" className="py-32 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-ukraine-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Side */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
            <span className="inline-block px-4 py-2 bg-ukraine-blue/20 text-ukraine-blue font-barlow font-bold tracking-[0.2em] uppercase text-sm mb-6">
              Beyond The Court
            </span>
            <h2 className="font-bebas text-6xl md:text-7xl mb-8 leading-none">
              A PASSION FOR <span className="text-gold">FISHING</span>
            </h2>

            <div className="space-y-6 font-inter text-slate-300 text-lg leading-relaxed">
              <p>
                Long before the roar of stadium crowds, young Oleh found peace in the quiet waters of Ukraine.
                <strong> Fishing has been his lifelong passion</strong>, a tradition passed down through generations
                in his family from Letkivka village, Vinnytsia Oblast.
              </p>
              <p>
                Growing up in the Ukrainian countryside, Oleh spent countless hours by rivers and lakes,
                learning patience and focus — skills that would later define his game on the volleyball court.
                The tranquility of fishing provided a perfect counterbalance to the intensity of competitive sports.
              </p>
              <p>
                Even today, between grueling training sessions and championship matches, Oleh returns to the
                water whenever possible. It's his way of reconnecting with his roots, finding calm amid the
                storm of professional athletics, and honoring the simple joys of his Ukrainian heritage.
              </p>
            </div>

            {/* Hobby Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-10 border-t border-white/10">
              <div className="text-center">
                <div className="font-bebas text-4xl text-gold">20+</div>
                <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-xs">Years Fishing</div>
              </div>
              <div className="text-center">
                <div className="font-bebas text-4xl text-gold">Carp</div>
                <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-xs">Favorite Catch</div>
              </div>
              <div className="text-center">
                <div className="font-bebas text-4xl text-gold">Dawn</div>
                <div className="font-barlow font-bold text-slate-400 uppercase tracking-widest text-xs">Best Time</div>
              </div>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300">
            <div className="grid grid-cols-2 gap-4">
              {/* Main large image */}
              <div className="col-span-2 aspect-video overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-fishing-1.jpg"
                  alt="Oleh Plotnytskyi fishing"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>

              {/* Smaller images */}
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-fishing-2.jpg"
                  alt="Oleh fishing"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-fishing-3.jpg"
                  alt="Oleh with catch"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Quote overlay */}
            <div className="absolute -bottom-6 -left-6 bg-gold text-slate-950 p-6 max-w-xs shadow-2xl hidden md:block">
              <p className="font-inter text-sm italic leading-relaxed">
                "Fishing teaches you patience. In volleyball, you wait for the perfect moment to strike.
                By the water, you learn that timing is everything."
              </p>
              <div className="font-bebas text-lg mt-3">— Oleh Plotnytskyi</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
