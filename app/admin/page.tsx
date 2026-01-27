"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER", "FULFILLMENT", "SUPPORT"]);

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
};

export default function AdminHome() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      const data = await res.json();
      setUser(data.user ?? null);
      setLoading(false);
    };

    load();
  }, []);

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

