
"use client";

import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { CareerTimeline } from './components/CareerTimeline';
import { Stats } from './components/Stats';
import { ShopPreview } from './components/ShopPreview';
import { TrophyBanner } from './components/TrophyBanner';
import { Footer } from './components/Footer';
import { Gallery } from './components/Gallery';
import { Videos } from './components/Videos';
import { Hobbies } from './components/Hobbies';
import { Family } from './components/Family';

function App() {
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
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <About />
        <Family />
        <Hobbies />
        <CareerTimeline />
        <Gallery />
        <Videos />
        <ShopPreview />
        <TrophyBanner />
      </main>
      <Footer />
    </div>
  );
}

export default App;
