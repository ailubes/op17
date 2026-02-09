import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: 'Oleh Plotnytskyi | Ukrainian Thunder',
  description:
    'Official website of Oleh Plotnytskyi - Ukrainian volleyball star, Sir Sicoma Monini Perugia outside hitter, 2x Club World Champion, and former Ukraine national team captain. The Beast from Ukraine.',
  keywords: ['Oleh Plotnytskyi', 'Ukrainian Thunder', 'volleyball', 'Sir Sicoma Monini Perugia', 'Ukraine volleyball', 'professional athlete', 'outside hitter', 'Club World Champion', 'MVP'],
  authors: [{ name: 'Oleh Plotnytskyi' }],
  robots: 'index, follow',
  metadataBase: new URL('https://op17.fit'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'profile',
    title: 'Oleh Plotnytskyi | Ukrainian Thunder',
    description: 'Official website of Oleh Plotnytskyi - Ukrainian volleyball star, 2x Club World Champion, and former Ukraine national team captain. The Beast from Ukraine.',
    url: 'https://op17.fit/',
    siteName: 'OP17 - Oleh Plotnytskyi',
    locale: 'en_US',
    images: [
      {
        url: '/images/oleh-wikipedia.jpg',
        width: 1200,
        height: 630,
        alt: 'Oleh Plotnytskyi - Ukrainian Thunder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oleh Plotnytskyi | Ukrainian Thunder',
    description: 'Official website of Oleh Plotnytskyi - Ukrainian volleyball star, 2x Club World Champion, and former Ukraine national team captain. The Beast from Ukraine.',
    images: ['/images/oleh-wikipedia.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://op17.fit/#website',
      url: 'https://op17.fit/',
      name: 'OP17 - Oleh Plotnytskyi',
      description: 'The official digital home of Oleh Plotnytskyi, celebrating excellence in volleyball and the indomitable spirit of the Ukrainian people.',
      inLanguage: 'en-US',
    },
    {
      '@type': ['Person', 'Athlete'],
      '@id': 'https://op17.fit/#person',
      name: 'Oleh Plotnytskyi',
      alternateName: ['Ukrainian Thunder', 'The Beast'],
      givenName: 'Oleh',
      familyName: 'Plotnytskyi',
      birthDate: '1997-06-05',
      birthPlace: {
        '@type': 'Place',
        name: 'Letkivka, Vinnytsia Oblast, Ukraine',
      },
      nationality: {
        '@type': 'Country',
        name: 'Ukraine',
      },
      height: {
        '@type': 'QuantitativeValue',
        value: 195,
        unitCode: 'CMT',
      },
      jobTitle: 'Professional Volleyball Player',
      description: "Ukrainian professional volleyball player, outside hitter for Sir Sicoma Monini Perugia, former captain of the Ukraine national team (2018-2025). Known for his powerful left-handed serve and nicknamed 'The Beast'.",
      memberOf: {
        '@type': 'SportsTeam',
        name: 'Sir Sicoma Monini Perugia',
        sport: 'Volleyball',
      },
      award: [
        '2x Club World Champion (2022, 2023)',
        'Club World Championship MVP (2023)',
        'Best Server - 2022 World Championship',
        'CEV European Golden League Winner (2024)',
        '5x Supercoppa Italiana',
        '2x Coppa Italia',
        'U20 European Championship MVP (2016)',
      ],
      sameAs: [
        'https://www.instagram.com/oleh_plotnytskyi/',
        'https://volleybox.net/oleh-plotnytskyi-p10543',
        'https://en.wikipedia.org/wiki/Oleh_Plotnytskyi',
      ],
      image: 'https://op17.fit/images/oleh-wikipedia.jpg',
      url: 'https://op17.fit/',
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-white font-inter">
        {children}
        <div className="noise"></div>
      </body>
    </html>
  );
}
