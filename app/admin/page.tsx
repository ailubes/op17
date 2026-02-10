"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    return <p className="text-slate-400">Loading session...</p>;
  }

  const hasAccess = user?.roles?.some((role) => ADMIN_ROLES.has(role));

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <h1 className="font-bebas text-4xl">Admin Access Required</h1>
        <p className="text-slate-400">
          Please sign in with an admin account to manage collections and products.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center px-6 py-3 bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bebas text-5xl">Welcome back</h1>
        <p className="text-slate-400 mt-2">Signed in as {user?.email}</p>
      </div>

      {/* Stats Section */}
      <section>
        <h2 className="font-bebas text-2xl mb-4">Today at a Glance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Orders"
            value={statsLoading ? "..." : stats?.todayOrders ?? 0}
            href="/admin/orders"
            color="blue"
          />
          <StatCard
            title="Pending Orders"
            value={statsLoading ? "..." : stats?.pendingOrders ?? 0}
            href="/admin/orders?status=PENDING"
            color="gold"
          />
          <StatCard
            title="Today's Revenue"
            value={
              statsLoading
                ? "..."
                : stats
                ? formatCurrency(stats.todayRevenue)
                : "—"
            }
            href="/admin/orders"
            color="green"
          />
          <StatCard
            title="Low Stock Items"
            value={statsLoading ? "..." : stats?.lowStockVariants ?? 0}
            href="/admin/variants"
            color={stats && stats.lowStockVariants > 0 ? "red" : "slate"}
          />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Categories",
            description: "Organize navigation and storefront filters.",
            href: "/admin/categories",
          },
          {
            title: "Orders",
            description: "Track payments and fulfillment status.",
            href: "/admin/orders",
          },
          {
            title: "Collections",
            description: "Schedule drops and manage always-on collections.",
            href: "/admin/collections",
          },
          {
            title: "Products",
            description: "Create products, assign categories, set pricing.",
            href: "/admin/products",
          },
          {
            title: "Variants",
            description: "Manage sizes, colors, and inventory for each SKU.",
            href: "/admin/variants",
          },
          {
            title: "Promo Codes",
            description: "Create and manage discount codes.",
            href: "/admin/promo-codes",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="border border-white/10 bg-slate-900/60 p-6 transition hover:border-gold"
          >
            <h2 className="font-bebas text-2xl text-white mb-2">{item.title}</h2>
            <p className="text-sm text-slate-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  color,
}: {
  title: string;
  value: string | number;
  href: string;
  color: "blue" | "gold" | "green" | "red" | "slate";
}) {
  const colorClasses = {
    blue: "border-ukraine-blue/30 bg-ukraine-blue/10",
    gold: "border-gold/30 bg-gold/10",
    green: "border-green-500/30 bg-green-500/10",
    red: "border-red-500/30 bg-red-500/10",
    slate: "border-white/10 bg-slate-900/60",
  };

  const valueColors = {
    blue: "text-ukraine-blue",
    gold: "text-gold",
    green: "text-green-400",
    red: "text-red-400",
    slate: "text-slate-300",
  };

  return (
    <Link
      href={href}
      className={`block border p-4 transition hover:opacity-80 ${colorClasses[color]}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`font-bebas text-4xl mt-1 ${valueColors[color]}`}>{value}</p>
    </Link>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

