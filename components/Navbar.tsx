
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { setClientLocale } from "@/lib/locale";
import { useLocale } from "@/lib/use-locale";
import type { HomeMessages } from "@/lib/i18n";

type NavbarProps = {
  copy: HomeMessages["nav"];
};

export const Navbar: React.FC<NavbarProps> = ({ copy }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const [activeLocale, setActiveLocale] = useState<"en" | "uk" | "it">("en");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setActiveLocale(locale);
  }, [locale, mounted]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const changeLocale = (nextLocale: "en" | "uk" | "it") => {
    if (nextLocale === activeLocale) return;
    setClientLocale(nextLocale);
    setActiveLocale(nextLocale);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const navLinks = [
    { name: copy.athlete, id: "#athlete" },
    { name: copy.family, id: "#family" },
    { name: copy.hobbies, id: "#hobbies" },
    { name: copy.career, id: "#career" },
    { name: copy.gallery, id: "#gallery" },
    { name: copy.contact, id: "#contact" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full px-6 md:px-14 py-6 z-[1000] transition-all duration-300 flex justify-between items-center ${scrolled ? 'bg-slate-950/90 backdrop-blur-md shadow-2xl py-4' : 'bg-transparent'}`}>
        <Link href="/" className="font-bebas text-3xl tracking-widest text-white flex items-center gap-2 group">
          <img
            src="/images/logos/blue-yellow.png"
            alt="Oleh Plotnytskyi OP17 logo"
            className="h-10 md:h-12 w-auto transition-transform group-hover:scale-105"
          />
          <span className="sr-only">OP17</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.id}
              className="font-barlow font-semibold text-sm uppercase tracking-[0.15em] text-slate-300 hover:text-gold transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
            </a>
          ))}
          <Link
            href="/shop"
            className="font-barlow font-semibold text-sm uppercase tracking-[0.15em] text-gold hover:text-white transition-colors relative group"
          >
            {copy.shop}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Language switcher - desktop */}
          <div
            className="hidden sm:flex items-center gap-2 border border-white/10 bg-slate-900/60 px-2 py-1"
            suppressHydrationWarning
          >
            {[
              { label: "EN", value: "en" },
              { label: "UK", value: "uk" },
              { label: "IT", value: "it" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => changeLocale(item.value as "en" | "uk" | "it")}
                className={`px-2 py-1 text-[11px] font-barlow font-bold uppercase tracking-[0.2em] transition-colors ${
                  activeLocale === item.value
                    ? "bg-gold text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Shop Now link - hidden on mobile (available in mobile menu) */}
          <Link
            href="/shop"
            className="hidden sm:block font-barlow font-bold text-gold uppercase tracking-wider hover:text-white transition-colors"
          >
            {copy.shopNow}
          </Link>

          {/* Hamburger button - mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-[999] bg-slate-950/95 backdrop-blur-md transition-opacity duration-300 lg:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.id}
              onClick={() => setMenuOpen(false)}
              className="font-bebas text-3xl uppercase tracking-widest text-white hover:text-gold transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Link
            href="/shop"
            onClick={() => setMenuOpen(false)}
            className="font-bebas text-3xl uppercase tracking-widest text-gold hover:text-white transition-colors"
          >
            {copy.shop}
          </Link>

          {/* Language switcher inside mobile menu */}
          <div
            className="flex items-center gap-2 border border-white/10 bg-slate-900/60 px-3 py-2 mt-4"
            suppressHydrationWarning
          >
            {[
              { label: "EN", value: "en" },
              { label: "UK", value: "uk" },
              { label: "IT", value: "it" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => changeLocale(item.value as "en" | "uk" | "it")}
                className={`px-3 py-1.5 text-sm font-barlow font-bold uppercase tracking-[0.2em] transition-colors ${
                  activeLocale === item.value
                    ? "bg-gold text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
