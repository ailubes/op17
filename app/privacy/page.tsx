import React from "react";
import { cookies } from "next/headers";
import { getMessages } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";
import type { Metadata } from "next";
import ClientLayout from "../(pages)/ClientLayout";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);

  return {
    title: messages.privacyPage.meta.title,
    description: messages.privacyPage.meta.description,
  };
}

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const page = messages.privacyPage;

  return (
    <ClientLayout>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ukraine-blue/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-14 relative z-10 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-barlow font-bold uppercase tracking-[0.3em] text-gold text-sm mb-6 block reveal opacity-0 translate-y-10 transition-all duration-1000">
              Legal
            </span>
            <h1 className="font-bebas text-5xl md:text-6xl lg:text-7xl text-white leading-none mb-4 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-100">
              {page.header.title}
            </h1>
            <p className="font-inter text-slate-500 reveal opacity-0 translate-y-10 transition-all duration-1000 delay-200">
              {page.header.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-14">
          <div className="max-w-3xl mx-auto">
            {/* Sections */}
            <div className="space-y-12">
              {page.sections.map((section, index) => (
                <section
                  key={index}
                  className="reveal opacity-0 translate-y-10 transition-all duration-1000"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <h2 className="font-barlow font-bold uppercase tracking-wider text-xl text-white mb-4">
                    {section.title}
                  </h2>
                  <p className="font-inter text-slate-400 leading-relaxed">
                    {section.content}
                  </p>
                </section>
              ))}

              {/* Contact Section */}
              <section className="pt-8 border-t border-white/10 reveal opacity-0 translate-y-10 transition-all duration-1000">
                <h2 className="font-barlow font-bold uppercase tracking-wider text-xl text-white mb-4">
                  {page.contact.title}
                </h2>
                <p className="font-inter text-slate-400 leading-relaxed mb-4">
                  {page.contact.content}
                </p>
                <a
                  href="mailto:privacy@op17.fit"
                  className="font-inter text-gold hover:underline"
                >
                  privacy@op17.fit
                </a>
              </section>
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}
