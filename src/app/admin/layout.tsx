"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  UserCheck,
  Activity,
  Bell,
  Settings,
  ShieldCheck,
  ExternalLink,
  LogOut,
  User,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("slj_current_access_code");
    }
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/batches", label: "Batches", icon: Layers },
    { href: "/admin/participants", label: "Participants", icon: Users },
    { href: "/admin/coaches", label: "Coaches", icon: UserCheck },
    { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#EAE5D9] flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-[#EAE5D9]">
          <Link href="/" className="inline-block">
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="border-l border-slate-200 pl-3">
            <h2 className="font-extrabold text-[#071A33] text-xs leading-tight">Admin Portal</h2>
            <p className="text-[10px] text-gray-500 font-medium">BinaHub Life OS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#0B2C6B] text-white shadow-md shadow-[#0B2C6B]/20"
                    : "text-slate-600 hover:bg-[#FAF8F4] hover:text-[#071A33]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#C79A3C]" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Company HR Portal Link & Logout */}
        <div className="p-4 border-t border-[#EAE5D9] bg-[#FAF8F4]/80 space-y-3">
          <div className="rounded-xl border border-[#C79A3C]/30 bg-white p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
              <ShieldCheck className="h-4 w-4 text-[#C79A3C]" />
              <span>Company Dashboard</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Portal statistik HR tanpa akses ke jurnal pribadi.
            </p>
            <Link
              href="/company"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0B2C6B] hover:text-[#071A33] pt-1"
            >
              Pratinjau Dashboard HR <ExternalLink className="h-3 w-3 text-[#C79A3C]" />
            </Link>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl border border-red-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Logout</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar with Profile & Logout Quick Access */}
        <header className="h-16 bg-white border-b border-[#EAE5D9] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600">Administrator System Active</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#071A33] bg-[#FAF8F4] px-3 py-1.5 rounded-lg border border-[#EAE5D9]">
              <User className="h-4 w-4 text-[#C79A3C]" />
              <span>Super Admin</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
