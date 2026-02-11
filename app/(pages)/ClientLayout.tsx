"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { getMessages } from "@/lib/i18n";
import { getClientLocale, type AppLocale } from "@/lib/locale";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<AppLocale>("en");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  // Scroll reveal animation
  useEffect(() => {
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

  const messages = getMessages(locale);
  const nav = messages.home.nav;
  const footerCopy = messages.home.footer;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed top-1/4 left-0 w-[500px] h-[500px] bg-ukraine-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 noise opacity-[0.03] pointer-events-none z-[100]" />

      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6 md:px-14">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/images/logos/blue-yellow.png"
                alt="OP17"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
              <span className="font-bebas text-2xl text-white tracking-wider">
                OP17
              </span>
            </Link>

            {/* Back to Home */}
            <Link
              href="/"
              className="font-barlow font-bold uppercase tracking-wider text-sm text-slate-400 hover:text-gold transition-colors"
            >
              ← {nav.shop || "Back to Home"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 relative z-10">{children}</main>

      {/* Footer */}
      <Footer copy={footerCopy} />
    </div>
  );
}
