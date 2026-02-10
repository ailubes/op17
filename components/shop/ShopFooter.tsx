"use client";

import Link from "next/link";

interface FooterTranslations {
  tagline: string;
  shopLinks: string;
  support: string;
  shopHome: string;
  cart: string;
  checkout: string;
  paymentStatus: string;
  shipping: string;
  payments: string;
  supportEmail: string;
  rights: string;
  official: string;
}

interface ShopFooterProps {
  t: FooterTranslations;
}

export function ShopFooter({ t }: ShopFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="container mx-auto px-6 md:px-14 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <img
                src="/images/logos/blue-yellow.png"
                alt="Oleh Plotnytskyi OP17 logo"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
              <span className="sr-only">OP17</span>
            </Link>
            <p className="mt-4 text-slate-400 text-sm max-w-xs">{t.tagline}</p>
          </div>
          <div>
            <h4 className="font-barlow font-bold uppercase tracking-widest mb-4 text-white">
              {t.shopLinks}
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/shop" className="hover:text-gold transition-colors">
                  {t.shopHome}
                </Link>
              </li>
              <li>
                <Link href="/shop/cart" className="hover:text-gold transition-colors">
                  {t.cart}
                </Link>
              </li>
              <li>
                <Link href="/shop/checkout" className="hover:text-gold transition-colors">
                  {t.checkout}
                </Link>
              </li>
              <li>
                <Link href="/shop/payment-status" className="hover:text-gold transition-colors">
                  {t.paymentStatus}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-barlow font-bold uppercase tracking-widest mb-4 text-white">
              {t.support}
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>{t.shipping}</li>
              <li>{t.payments}</li>
              <li>{t.supportEmail}</li>
            </ul>
          </div>
        </div>

        <div className="pt-10 mt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Plotnytskyi Collection. {t.rights}
          </p>
          <p className="uppercase tracking-[0.2em] text-slate-600">{t.official}</p>
        </div>
      </div>
    </footer>
  );
}
