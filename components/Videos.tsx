
import React from 'react';

const videos = [
    {
        id: 1,
        title: "2023 Club World Championship MVP Performance",
        thumbnail: "/images/oleh-mvp.jpg",
        duration: "08:45",
        views: "250K"
    },
    {
        id: 2,
        title: "Best Server - 2022 World Championship",
        thumbnail: "/images/oleh-action-1.jpg",
        duration: "05:30",
        views: "890K"
    },
    {
        id: 3,
        title: "U20 Euros: The Legendary Comeback vs Italy",
        thumbnail: "/images/oleh-celebration.jpg",
        duration: "12:15",
        views: "450K"
    }
];

export const Videos: React.FC = () => {
    return (
        <section id="videos" className="py-32 bg-slate-900 relative">
             <div className="container mx-auto px-6 md:px-14">
                <div className="mb-16 reveal opacity-0 translate-y-10 transition-all duration-1000">
                    <h2 className="font-bebas text-6xl md:text-8xl uppercase tracking-tight leading-none mb-4">
                        Highlights <span className="text-gold">Reel</span>
                    </h2>
                    <p className="font-inter text-slate-400 max-w-xl text-lg">
                        Relive the most explosive moments, game-winning serves, and championship celebrations.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Featured Video Placeholder */}
                    <div className="lg:col-span-2 group cursor-pointer reveal opacity-0 translate-y-10 transition-all duration-1000">
                         <div className="relative aspect-video bg-slate-800 border border-white/10 overflow-hidden shadow-2xl">
                            <img src="/images/oleh-attack.jpg" alt="Featured Video" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"/>
                            
                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center pl-1 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(255,213,0,0.5)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-6 left-6 right-6">
                                <span className="inline-block px-3 py-1 bg-ukraine-blue text-white font-barlow font-bold text-xs uppercase tracking-wider mb-2">Featured</span>
                                <h3 className="font-bebas text-4xl text-white drop-shadow-lg">2024 Triple Crown: Scudetto, Coppa & Supercoppa</h3>
                            </div>
                         </div>
                    </div>

                    {/* Side List */}
                    <div className="flex flex-col gap-6">
                        {videos.map((video, index) => (
                            <div key={video.id} className="flex gap-4 group cursor-pointer reveal opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: `${index * 150}ms` }}>
                                <div className="relative w-40 aspect-video bg-slate-800 overflow-hidden border border-white/5 shrink-0">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"/>
                                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white">{video.duration}</div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bebas text-xl text-white group-hover:text-gold transition-colors line-clamp-2 leading-tight mb-1">
                                        {video.title}
                                    </h4>
                                    <span className="font-barlow text-slate-500 text-sm uppercase tracking-wider">{video.views} Views</span>
                                </div>
                            </div>
                        ))}
                        
                        <div className="mt-auto pt-6 border-t border-white/10 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-500">
                             <a href="#" className="flex items-center gap-2 font-barlow font-bold text-gold uppercase tracking-widest hover:text-white transition-colors">
                                Watch All Videos <span className="text-xl">→</span>
                             </a>
                        </div>
                    </div>
                </div>
             </div>
        </section>
    );
};
