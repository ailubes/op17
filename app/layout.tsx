import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Oleh Plotnytskyi | Ukrainian Thunder',
  description:
    'The official personal website of Oleh Plotnytskyi, Ukrainian volleyball champion and Sir Safety Perugia outside hitter. Featuring career highlights, statistics, and exclusive merchandise.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Bebas+Neue&family=Inter:wght@300;400;600&display=swap"
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
