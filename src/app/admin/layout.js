"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ClipboardList,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  Users,
} from "lucide-react";
import { getAuthToken, getCurrentUser, setAuthToken } from "@/lib/api";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const readUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("mavidhai_user") || "null"));
      } catch {
        setUser(null);
      }
    };
    readUser();
    if (getAuthToken()) {
      getCurrentUser()
        .then((currentUser) => {
          setUser(currentUser);
          localStorage.setItem("mavidhai_user", JSON.stringify(currentUser));
        })
        .catch(() => setUser(null));
    }
    window.addEventListener("mavidhai-auth-changed", readUser);
    return () => window.removeEventListener("mavidhai-auth-changed", readUser);
  }, []);

  useEffect(() => {
    if (user?.role === "SUB_ADMIN" && (pathname === "/admin" || pathname.startsWith("/admin/users"))) {
      router.replace("/admin/products");
    }
  }, [pathname, router, user]);

  const navItems = [
    ...(user?.role === "SUB_ADMIN" ? [] : [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }]),
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    { label: "Orders", href: "/admin/orders", icon: ClipboardList },
    ...(user?.role === "SUPER_ADMIN" ? [{ label: "Users", href: "/admin/users", icon: Users }] : []),
  ];

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("mavidhai_user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-gray-900 antialiased">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#E8DFC8] bg-white shadow-sm">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-[#F0E9D8] px-6">
          <Link href="/admin" className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#B8860B]">
              VRHAZ
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-700/70">
              {user?.role === "SUB_ADMIN" ? "Sub-Admin Portal" : "Super Admin Portal"}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white shadow-md shadow-amber-900/10"
                    : "text-stone-600 hover:bg-amber-50/60 hover:text-amber-900"
                }`}
              >
                <Icon size={19} className={isActive ? "text-white" : "text-amber-700/70"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[#F0E9D8] p-4 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-amber-50/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={15} />
              View Customer Store
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E8DFC8] bg-white/90 px-8 backdrop-blur-md">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
            <input
              type="text"
              placeholder="Search products, orders, or categories..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-10 pr-4 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#B8860B] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-full p-2 text-stone-500 hover:bg-amber-50 hover:text-stone-700"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#B8860B]" />
            </button>

            <div className="h-5 w-px bg-stone-200" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-[#B8860B] font-extrabold text-sm border border-amber-200">
                SA
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-stone-800">{user?.role === "SUB_ADMIN" ? "Sub-Admin" : "Super Admin"}</p>
                <p className="text-[10px] text-stone-500">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
