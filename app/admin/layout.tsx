"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { ToastProvider } from "@/components/admin";

const navItems = [
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/variants", label: "Variants" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
];

const adminOnlyNavItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin for showing admin-only navigation
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        setIsAdmin(data.user?.roles?.some((r: string) => r === "ADMIN") ?? false);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-slate-950/95 sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Link href="/" className="font-bebas text-xl sm:text-2xl tracking-widest">
                  OP17 Admin
                </Link>
                <span className="hidden sm:inline text-xs uppercase tracking-[0.3em] text-slate-500">
                  Console
                </span>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-6 text-sm uppercase tracking-[0.2em] text-slate-400">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <>
                    <span className="w-px h-4 bg-white/20" />
                    {adminOnlyNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:text-gold transition-colors text-gold/80"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Nav */}
            <nav
              className={`lg:hidden overflow-hidden transition-all duration-200 ${
                mobileMenuOpen ? "max-h-[500px] mt-4 pt-4 border-t border-white/10" : "max-h-0"
              }`}
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-gold hover:bg-white/5 rounded-lg transition-colors min-h-[44px] flex items-center"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-white/10" />
                    {adminOnlyNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-sm uppercase tracking-[0.2em] text-gold/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors min-h-[44px] flex items-center"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
