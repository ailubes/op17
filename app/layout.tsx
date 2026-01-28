import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: 'Oleh Plotnytskyi | Ukrainian Thunder',
  description:
    'The official personal website of Oleh Plotnytskyi, Ukrainian volleyball champion and Sir Safety Perugia outside hitter. Featuring career highlights, statistics, and exclusive merchandise.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;

  return (
    <html lang={locale} data-locale={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Bebas+Neue&family=Inter:wght@300;400;600&family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-white font-inter">
        {children}
        <div className="noise"></div>
      </body>
    </html>
  );
}
