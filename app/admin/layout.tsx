import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bebas text-2xl tracking-widest">
              OP17 Admin
            </Link>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Console</span>
          </div>
          <nav className="flex items-center gap-6 text-sm uppercase tracking-[0.2em] text-slate-400">
            <Link href="/admin/categories" className="hover:text-gold transition-colors">
              Categories
            </Link>
            <Link href="/admin/orders" className="hover:text-gold transition-colors">
              Orders
            </Link>
            <Link href="/admin/collections" className="hover:text-gold transition-colors">
              Collections
            </Link>
            <Link href="/admin/products" className="hover:text-gold transition-colors">
              Products
            </Link>
            <Link href="/admin/variants" className="hover:text-gold transition-colors">
              Variants
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

