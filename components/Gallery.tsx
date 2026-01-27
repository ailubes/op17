import React from "react";
import type { HomeMessages } from "@/lib/i18n";

const galleryImages = [
  { src: "/images/oleh-wikipedia.jpg", height: "h-96" },
  { src: "/images/oleh-celebration.jpg", height: "h-64" },
  { src: "/images/oleh-action-1.jpg", height: "h-[500px]" },
  { src: "/images/oleh-mvp.jpg", height: "h-72" },
  { src: "/images/oleh-portrait.jpg", height: "h-80" },
  { src: "/images/oleh-action-2.jpg", height: "h-64" },
  { src: "/images/oleh-action-3.jpg", height: "h-96" },
  { src: "/images/oleh-attack.jpg", height: "h-72" },
];

type GalleryProps = {
  copy: HomeMessages["gallery"];
};

export const Gallery: React.FC<GalleryProps> = ({ copy }) => {
  const images = galleryImages.map((image, index) => ({
    ...image,
    alt: copy.images[index]?.alt || "",
    category: copy.images[index]?.category || "",
  }));

  return (
    <section id="gallery" className="py-32 bg-slate-950 relative">
      <div className="container mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 reveal opacity-0 translate-y-10 transition-all duration-1000">
          <div>
            <h2 className="font-bebas text-6xl md:text-8xl uppercase tracking-tight leading-none mb-4">
              {copy.titleLead} <span className="text-gold">{copy.titleHighlight}</span>
            </h2>
            <p className="font-inter text-slate-400 max-w-xl text-lg">{copy.subtitle}</p>
          </div>
          <div className="hidden md:block">
            <button className="text-white font-barlow font-bold uppercase tracking-widest border-b border-gold pb-1 hover:text-gold transition-colors">
              {copy.viewArchive}
            </button>
          </div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((img, index) => (
            <div
              key={index}
              className="break-inside-avoid relative group overflow-hidden border border-white/5 rounded-sm reveal opacity-0 translate-y-10 transition-all duration-1000"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                <span className="font-barlow font-bold text-gold text-xs uppercase tracking-widest mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  {img.category}
                </span>
                <h3 className="font-bebas text-2xl text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {img.alt}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button className="px-8 py-3 border border-white/20 text-white font-barlow font-bold uppercase tracking-widest hover:border-gold hover:text-gold transition-all">
            {copy.viewArchive}
          </button>
        </div>
      </div>
    </section>
  );
};
