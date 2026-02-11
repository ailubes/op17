import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getMessages } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";
import type { Metadata } from "next";
import NewsletterForm from "./NewsletterForm";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);

  return {
    title: messages.fanZonePage.meta.title,
    description: messages.fanZonePage.meta.description,
  };
}

export default async function FanZonePage() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const page = messages.fanZonePage;

  // Gallery images with varying heights for masonry
  const galleryImages = [
    { src: "/images/oleh-action-1.jpg", alt: "Action Shot 1", height: "h-96" },
    { src: "/images/oleh-action-2.jpg", alt: "Action Shot 2", height: "h-64" },
    { src: "/images/oleh-action-3.jpg", alt: "Action Shot 3", height: "h-[500px]" },
    { src: "/images/oleh-attack.jpg", alt: "Attack", height: "h-72" },
    { src: "/images/plotnytskyi-family.jpg", alt: "Family", height: "h-80" },
    { src: "/images/oleh-portrait.jpg", alt: "Oleh Portrait", height: "h-96" },
  ];

  return (
    <>
      {/* Hero Section - Full Viewport with Outline Text Effect */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-ukraine-blue/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-14 relative z-10 text-center">
          <span className="font-barlow font-bold uppercase tracking-[0.3em] text-gold text-sm mb-6 block reveal opacity-0 translate-y-10 transition-all duration-1000">
            SLAVA UKRAINI
          </span>
          <h1 className="font-bebas text-6xl md:text-8xl lg:text-9xl text-white leading-none mb-6 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100">
            {page.hero.title}
          </h1>
          <p className="font-bebas text-2xl md:text-3xl lg:text-4xl text-slate-400 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            {page.hero.subtitle}
          </p>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-500">
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-500 text-xs">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
          </div>
        </div>
      </section>

      {/* Photo Gallery - Masonry Layout */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 md:px-14">
          <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-16 text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            {page.gallery.title}
          </h2>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="break-inside-avoid relative group overflow-hidden border border-white/5 rounded-sm reveal opacity-0 translate-y-10 transition-all duration-1000"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <span className="font-barlow font-bold text-gold text-xs uppercase tracking-widest mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    Gallery
                  </span>
                  <h3 className="font-bebas text-2xl text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {image.alt}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Links - Enhanced Cards */}
      <section className="py-24 md:py-32 bg-slate-950/50 border-y border-white/5">
        <div className="container mx-auto px-6 md:px-14">
          <div className="text-center mb-16">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-4 reveal opacity-0 translate-y-10 transition-all duration-1000">
              {page.social.title}
            </h2>
            <p className="font-inter text-slate-400 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100">
              {page.social.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/oleh_plotnytskyi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 hover:border-gold/50 hover:-translate-y-2 hover:bg-white/10 transition-all duration-300 group reveal opacity-0 translate-y-10 transition-all duration-1000"
            >
              <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition-all group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div>
                <p className="font-barlow font-bold uppercase tracking-wider text-white text-lg">
                  Instagram
                </p>
                <p className="font-inter text-slate-400 text-sm">
                  {page.social.instagram}
                </p>
              </div>
            </a>

            {/* Volleybox */}
            <a
              href="https://volleybox.net/oleh-plotnytskyi-p10543"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 hover:border-gold/50 hover:-translate-y-2 hover:bg-white/10 transition-all duration-300 group reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100"
            >
              <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition-all group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div>
                <p className="font-barlow font-bold uppercase tracking-wider text-white text-lg">
                  Volleybox
                </p>
                <p className="font-inter text-slate-400 text-sm">
                  {page.social.volleybox}
                </p>
              </div>
            </a>

            {/* Wikipedia */}
            <a
              href="https://en.wikipedia.org/wiki/Oleh_Plotnytskyi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 hover:border-gold/50 hover:-translate-y-2 hover:bg-white/10 transition-all duration-300 group reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200"
            >
              <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-gold group-hover:text-gold transition-all group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div>
                <p className="font-barlow font-bold uppercase tracking-wider text-white text-lg">
                  Wikipedia
                </p>
                <p className="font-inter text-slate-400 text-sm">
                  {page.social.wikipedia}
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Fan Club Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ukraine-blue/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-14 relative z-10">
          <div className="max-w-3xl mx-auto text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {page.fanClub.title}
            </h2>
            <p className="font-barlow font-bold uppercase tracking-wider text-gold mb-6">
              {page.fanClub.subtitle}
            </p>
            <p className="font-inter text-slate-400 text-lg mb-8">
              {page.fanClub.description}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="font-barlow font-bold uppercase tracking-wider text-sm">
                {page.fanClub.comingSoon}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 md:py-32 bg-slate-950/50">
        <div className="container mx-auto px-6 md:px-14">
          <div className="max-w-2xl mx-auto text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {page.newsletter.title}
            </h2>
            <p className="font-barlow font-bold uppercase tracking-wider text-slate-400 mb-6">
              {page.newsletter.subtitle}
            </p>
            <p className="font-inter text-slate-400 mb-10">
              {page.newsletter.description}
            </p>

            <NewsletterForm
              placeholder={page.newsletter.placeholder}
              button={page.newsletter.button}
              success={page.newsletter.success}
            />
          </div>
        </div>
      </section>

      {/* Shop Preview Section */}
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto px-6 md:px-14">
          <div className="max-w-3xl mx-auto text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {page.shop.title}
            </h2>
            <p className="font-barlow font-bold uppercase tracking-wider text-slate-400 mb-10">
              {page.shop.subtitle}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-gold text-slate-950 px-10 py-4 font-bebas text-xl uppercase tracking-wider hover:bg-white transition-colors clip-btn"
            >
              {page.shop.cta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
