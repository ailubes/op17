import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getMessages } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);

  return {
    title: messages.aboutPage.meta.title,
    description: messages.aboutPage.meta.description,
  };
}

export default async function AboutPage() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const page = messages.aboutPage;

  return (
    <>
      {/* Hero Section - Dramatic Full Viewport */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/oleh-portrait.jpg"
            alt="Oleh Plotnytskyi"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Ambient Glow Effects */}
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-ukraine-blue/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-14 relative z-10 py-24">
          <div className="max-w-2xl">
            <span className="font-barlow font-bold uppercase tracking-[0.3em] text-gold text-sm mb-6 block reveal opacity-0 translate-y-10 transition-all duration-1000">
              {page.hero.tagline}
            </span>
            <h1 className="font-bebas text-5xl md:text-7xl lg:text-8xl text-white leading-none mb-4 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100">
              {page.hero.title}
            </h1>
            <p className="font-bebas text-3xl md:text-4xl lg:text-5xl text-slate-400 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
              {page.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid - Main Site Pattern */}
      <section className="relative z-20 -mt-16 container mx-auto px-6 md:px-14 reveal opacity-0 translate-y-10 transition-all duration-1000">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white/10 p-0.5 border border-white/10 shadow-2xl">
          <div className="bg-slate-900 p-10 flex flex-col items-center justify-center group hover:bg-ukraine-darker hover:-translate-y-2 transition-all duration-300 cursor-default">
            <span className="font-bebas text-5xl md:text-6xl text-gold leading-none group-hover:scale-110 transition-transform">
              {page.stats.height.value}
            </span>
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-400 text-sm mt-4 group-hover:text-white">
              {page.stats.height.label}
            </span>
          </div>
          <div className="bg-slate-900 p-10 flex flex-col items-center justify-center group hover:bg-ukraine-darker hover:-translate-y-2 transition-all duration-300 cursor-default">
            <span className="font-bebas text-5xl md:text-6xl text-gold leading-none group-hover:scale-110 transition-transform">
              {page.stats.spike.value}
            </span>
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-400 text-sm mt-4 group-hover:text-white">
              {page.stats.spike.label}
            </span>
          </div>
          <div className="bg-slate-900 p-10 flex flex-col items-center justify-center group hover:bg-ukraine-darker hover:-translate-y-2 transition-all duration-300 cursor-default">
            <span className="font-bebas text-5xl md:text-6xl text-gold leading-none group-hover:scale-110 transition-transform">
              {page.stats.titles.value}
            </span>
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-400 text-sm mt-4 group-hover:text-white">
              {page.stats.titles.label}
            </span>
          </div>
          <div className="bg-slate-900 p-10 flex flex-col items-center justify-center group hover:bg-ukraine-darker hover:-translate-y-2 transition-all duration-300 cursor-default">
            <span className="font-bebas text-5xl md:text-6xl text-gold leading-none group-hover:scale-110 transition-transform">
              {page.stats.years.value}
            </span>
            <span className="font-barlow font-bold uppercase tracking-widest text-slate-400 text-sm mt-4 group-hover:text-white">
              {page.stats.years.label}
            </span>
          </div>
        </div>
      </section>

      {/* Early Life Section - With Grayscale Hover Effect */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
              <span className="font-barlow font-bold uppercase tracking-[0.2em] text-gold text-sm mb-4 block">
                1997
              </span>
              <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-8">
                {page.earlyLife.title}
              </h2>
              <div className="space-y-6 font-inter text-slate-400 text-lg leading-relaxed">
                <p>{page.earlyLife.paragraph1}</p>
                <p>{page.earlyLife.paragraph2}</p>
              </div>
            </div>
            <div className="relative reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
              <div className="aspect-[4/5] relative overflow-hidden border border-white/10 group">
                <img
                  src="/images/plotnytskyi-family.jpg"
                  alt="Plotnytskyi Family"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-gold/30 -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gold/10 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Career Journey Section - Alternating Layout */}
      <section className="py-24 md:py-32 bg-slate-950/50">
        <div className="container mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative reveal opacity-0 translate-y-10 transition-all duration-1000">
              <div className="aspect-[4/5] relative overflow-hidden border border-white/10 group">
                <img
                  src="/images/oleh-action-1.jpg"
                  alt="Oleh Plotnytskyi in action"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-ukraine-blue/30 -z-10" />
            </div>
            <div className="order-1 lg:order-2 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
              <span className="font-barlow font-bold uppercase tracking-[0.2em] text-gold text-sm mb-4 block">
                2017 - Present
              </span>
              <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-8">
                {page.career.title}
              </h2>
              <div className="space-y-6 font-inter text-slate-400 text-lg leading-relaxed">
                <p>{page.career.paragraph1}</p>
                <p>{page.career.paragraph2}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Captaincy Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 md:px-14">
          <div className="max-w-4xl mx-auto text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            <span className="font-barlow font-bold uppercase tracking-[0.2em] text-gold text-sm mb-4 block">
              2018 - 2025
            </span>
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-8">
              {page.captaincy.title}
            </h2>
            <div className="space-y-6 font-inter text-slate-400 text-lg leading-relaxed">
              <p>{page.captaincy.paragraph1}</p>
              <p>{page.captaincy.paragraph2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values & Quote Section - Enhanced with Ambient Glow */}
      <section className="py-24 md:py-32 bg-slate-950/50 relative overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-ukraine-blue/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ukraine-blue/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-14 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-8 text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
              {page.values.title}
            </h2>
            <p className="font-inter text-slate-400 text-lg leading-relaxed text-center mb-16 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100">
              {page.values.paragraph1}
            </p>

            {/* Quote - Enhanced Block */}
            <blockquote className="relative border-l-4 border-gold pl-8 py-4 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-gold rounded-full shadow-[0_0_20px_rgba(255,213,0,0.8)]" />
              <p className="font-bebas text-2xl md:text-3xl text-white leading-relaxed mb-4">
                &ldquo;{page.values.quote}&rdquo;
              </p>
              <cite className="font-barlow font-bold uppercase tracking-wider text-gold not-italic">
                - Oleh Plotnytskyi
              </cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto px-6 md:px-14">
          <div className="max-w-3xl mx-auto text-center reveal opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {page.cta.title}
            </h2>
            <p className="font-inter text-slate-400 text-lg mb-10">
              {page.cta.subtitle}
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center bg-gold text-slate-950 px-10 py-4 font-bebas text-xl uppercase tracking-wider hover:bg-white transition-colors clip-btn"
            >
              {page.cta.button}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
