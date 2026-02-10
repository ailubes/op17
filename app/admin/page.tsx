"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER", "FULFILLMENT", "SUPPORT"]);
const LOW_STOCK_THRESHOLD = 5;

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
};

type DashboardStats = {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  lowStockVariants: number;
};

const navItems = [
  { title: "Categories", description: "Organize navigation and storefront filters.", href: "/admin/categories", icon: "folder" },
  { title: "Orders", description: "Track payments and fulfillment status.", href: "/admin/orders", icon: "shopping" },
  { title: "Collections", description: "Schedule drops and manage always-on collections.", href: "/admin/collections", icon: "collection" },
  { title: "Products", description: "Create products, assign categories, set pricing.", href: "/admin/products", icon: "box" },
  { title: "Variants", description: "Manage sizes, colors, and inventory for each SKU.", href: "/admin/variants", icon: "tag" },
  { title: "Promo Codes", description: "Create and manage discount codes.", href: "/admin/promo-codes", icon: "ticket" },
];

const adminNavItems = [
  { title: "Users", description: "Manage admin users and their roles.", href: "/admin/users", icon: "users" },
  { title: "Audit Logs", description: "Track all admin actions across the system.", href: "/admin/audit-logs", icon: "audit" },
];

const icons: Record<string, React.ReactNode> = {
  folder: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
  ),
  shopping: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
  ),
  collection: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  ),
  box: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  tag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  ),
  ticket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
  ),
  audit: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ),
};

export default function AdminHome() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      const data = await res.json();
      setUser(data.user ?? null);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [ordersRes, variantsRes] = await Promise.all([
          fetch("/api/admin/orders?limit=200", { credentials: "include" }),
          fetch("/api/admin/variants", { credentials: "include" }),
        ]);

        if (!ordersRes.ok || !variantsRes.ok) {
          setStatsLoading(false);
          return;
        }

        const ordersData = await ordersRes.json();
        const variantsData = await variantsRes.json();

        const orders = ordersData.data || [];
        const variants = variantsData.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = orders.filter((order: { createdAt: string }) => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        });

        const pendingOrders = orders.filter(
          (order: { status: string }) =>
            order.status === "PENDING" || order.status === "PAID"
        );

        const todayRevenue = todayOrders.reduce(
          (sum: number, order: { totalEur: number }) => sum + (order.totalEur || 0),
          0
        );

        const lowStockVariants = variants.filter(
          (variant: { stock: number; isActive: boolean }) =>
            variant.isActive && variant.stock < LOW_STOCK_THRESHOLD
        );

        setStats({
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          todayRevenue,
          lowStockVariants: lowStockVariants.length,
        });
      } catch {
        // Silently fail - stats are not critical
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading && user) {
      loadStats();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  const hasAccess = user?.roles?.some((role) => ADMIN_ROLES.has(role));

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="font-bebas text-3xl mb-2">Admin Access Required</h1>
        <p className="text-slate-400 mb-6">Please sign in with an admin account to continue.</p>
        <Link
          href="/admin/login"
          className="inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl sm:text-5xl">Welcome back</h1>
        <p className="text-slate-400 mt-2">Signed in as {user?.email}</p>
      </div>

      {/* Stats Section */}
      <section>
        <h2 className="font-bebas text-xl sm:text-2xl mb-4">Today at a Glance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Orders"
            value={statsLoading ? "—" : stats?.todayOrders ?? 0}
            href="/admin/orders"
            color="blue"
            icon={icons.shopping}
          />
          <StatCard
            title="Pending Orders"
            value={statsLoading ? "—" : stats?.pendingOrders ?? 0}
            href="/admin/orders"
            color="gold"
            icon={icons.shopping}
          />
          <StatCard
            title="Today's Revenue"
            value={statsLoading ? "—" : stats ? formatCurrency(stats.todayRevenue) : "—"}
            href="/admin/orders"
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Low Stock Items"
            value={statsLoading ? "—" : stats?.lowStockVariants ?? 0}
            href="/admin/variants"
            color={stats && stats.lowStockVariants > 0 ? "red" : "slate"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Navigation Cards */}
      <section>
        <h2 className="font-bebas text-xl sm:text-2xl mb-4">Management</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group border border-white/10 bg-slate-900/60 p-4 sm:p-6 rounded-lg transition-all duration-200 hover:border-gold/50 hover:bg-slate-900/80 active:scale-[0.99] touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-gold group-hover:bg-gold/10 transition-colors">
                  {icons[item.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bebas text-xl sm:text-2xl text-white mb-1">{item.title}</h2>
                  <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                </div>
                <svg
                  className="w-5 h-5 text-slate-600 group-hover:text-gold transition-colors flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin Section - Only for admins */}
      {user?.roles?.includes("ADMIN") && (
        <section>
          <h2 className="font-bebas text-xl sm:text-2xl mb-4">Administration</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adminNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group border border-gold/20 bg-slate-900/60 p-4 sm:p-6 rounded-lg transition-all duration-200 hover:border-gold/50 hover:bg-gold/5 active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gold/10 text-gold transition-colors">
                    {icons[item.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bebas text-xl sm:text-2xl text-white mb-1">{item.title}</h2>
                    <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-600 group-hover:text-gold transition-colors flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
