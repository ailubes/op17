
"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { CareerTimeline } from "./components/CareerTimeline";
import { Stats } from "./components/Stats";
import { ShopPreview } from "./components/ShopPreview";
import { TrophyBanner } from "./components/TrophyBanner";
import { Footer } from "./components/Footer";
import { Gallery } from "./components/Gallery";
import { Videos } from "./components/Videos";
import { Hobbies } from "./components/Hobbies";
import { Family } from "./components/Family";
import { getMessages } from "@/lib/i18n";
import { getClientLocale, type AppLocale } from "@/lib/locale";

type AppProps = {
  initialLocale?: AppLocale;
};

function App({ initialLocale = "en" }: AppProps) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const copy = getMessages(locale).home;

  useEffect(() => {
    // Reveal animation logic
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      <Navbar copy={copy.nav} />
      <main>
        <Hero copy={copy.hero} />
        <Stats copy={copy.stats} />
        <About copy={copy.about} />
        <Family copy={copy.family} />
        <Hobbies copy={copy.hobbies} />
        <CareerTimeline copy={copy.career} />
        <Gallery copy={copy.gallery} />
        <Videos copy={copy.videos} />
        <ShopPreview copy={copy.shopPreview} />
        <TrophyBanner copy={copy.trophy} />
      </main>
      <Footer copy={copy.footer} />
    </div>
  );
}

export default App;
