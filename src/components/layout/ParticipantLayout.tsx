"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Menu,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

interface ParticipantLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  pageTitle?: string;
  hideBackToHome?: boolean;
  noPadding?: boolean;
  hideFooter?: boolean;
}

export function ParticipantLayout({
  children,
  activePath,
  pageTitle,
  hideBackToHome = false,
  noPadding = false,
  hideFooter = false,
}: ParticipantLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const currentPath = activePath || pathname;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Peserta SLJ");

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.email) {
          setUserName(user.email.split("@")[0]);
        }
      }
    }
    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/journey", label: "Journey (PTP)", icon: Compass },
    { href: "/monitoring", label: "Monitoring", icon: TrendingUp },
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/notifications", label: "Notifikasi", icon: Bell },
  ];

  const bottomNavItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/journey", label: "Journey", icon: Compass },
    { href: "/monitoring", label: "Monitoring", icon: TrendingUp },
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/profile", label: "Profil", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-warm-bg text-navy-900 font-sans flex flex-col md:flex-row">
      {/* ─── DESKTOP LEFT SIDEBAR (Hidden on Mobile) ─── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-warm-border p-5 flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <Link href="/" className="inline-block py-1">
              <img
                src="/BinaJourney_logo.webp"
                alt="BinaJourney Logo"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-amber-100/80 text-navy-900 font-bold"
                      : "text-gray-600 hover:bg-warm-bg hover:text-navy-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-warm-border space-y-1 text-xs font-semibold text-gray-500">
          <Link
            href="/profile"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentPath === "/profile" ? "bg-amber-100/80 text-navy-900 font-bold" : "hover:bg-warm-bg hover:text-navy-900"
            }`}
          >
            <Users className="h-4 w-4 text-gray-400" />
            <span>Profil Saya</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentPath === "/settings" ? "bg-amber-100/80 text-navy-900 font-bold" : "hover:bg-warm-bg hover:text-navy-900"
            }`}
          >
            <Settings className="h-4 w-4 text-gray-400" />
            <span>Pengaturan</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE TOP HEADER (Hidden on Desktop) ─── */}
      <header className="flex md:hidden h-16 bg-white border-b border-warm-border px-4 items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="inline-block py-1">
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney Logo"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/notifications" className="p-2 text-slate-600 hover:text-navy-900">
            <Bell className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="flex items-center space-x-2 pl-1">
            <div className="h-7 w-7 rounded-full bg-navy-900 text-accent font-bold flex items-center justify-center text-xs border border-accent">
              {userName.charAt(0).toUpperCase()}
            </div>
          </Link>
        </div>
      </header>

      {/* ─── MOBILE DRAWER (Slide-out Sheet Menu) ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden h-[100dvh] w-screen overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <img
                  src="/BinaJourney_logo.webp"
                  alt="BinaJourney Logo"
                  className="h-8 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-1.5 py-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-full bg-navy-900 text-accent font-bold flex items-center justify-center text-xs shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy-900 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">BinaJourney 90 Hari</p>
                </div>
              </div>

              <nav className="space-y-1 text-xs font-semibold">
                {navItems.map((item) => {
                  const isActive = currentPath === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-amber-100 text-navy-900 font-bold shadow-2xs"
                          : "text-slate-600 hover:bg-warm-bg"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-1 text-xs font-semibold text-slate-600">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-warm-bg"
              >
                <Users className="h-4 w-4 text-slate-400" />
                <span>Profil Saya</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-warm-bg"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Pengaturan</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Sub-header (Left: Back to Home, Right: Bell, Avatar, Full Name) */}
        <header className="hidden md:flex h-16 bg-white border-b border-warm-border px-8 items-center justify-between sticky top-0 z-20">
          <div>
            {!hideBackToHome && currentPath !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-navy-900 bg-slate-50 border border-warm-border px-3.5 py-1.5 rounded-full shadow-2xs hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                <span>Kembali ke Home</span>
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-5">
            <Link
              href="/notifications"
              className="relative p-2 text-slate-500 hover:text-navy-900 transition-colors bg-warm-bg rounded-full hover:bg-slate-200/60"
              title="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center space-x-2.5 hover:opacity-85 transition-opacity py-1 px-2 rounded-xl hover:bg-warm-bg/70"
            >
              <div className="h-9 w-9 rounded-full bg-navy-900 text-amber-300 font-extrabold flex items-center justify-center text-xs overflow-hidden border-2 border-amber-400/40 shadow-2xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-navy-900 tracking-tight">{userName}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90 ml-0.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 ${noPadding ? "" : "p-4 md:p-8 pb-20 md:pb-8"}`}>
          {/* Back to Home bar — shown on pages except Home or when hidden explicitly */}
          {!hideBackToHome && currentPath !== "/dashboard" && (
            <div className="mb-4 md:mb-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-navy-900 bg-white border border-warm-border px-3 py-1.5 rounded-full shadow-2xs transition-colors hover:border-navy-900/30"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                <span>Kembali ke Home</span>
              </Link>
            </div>
          )}
          {children}
        </main>

        {/* Professional Clean Footer (Desktop Only) */}
        {!hideFooter && (
          <footer className="hidden md:block border-t border-warm-border bg-white py-4 px-6 md:px-12 text-xs text-slate-500">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center space-x-2.5">
                <img src="/BinaJourney_logo.webp" alt="BinaJourney Logo" className="h-5 w-auto object-contain" />
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-semibold text-slate-600">Spiritual Leadership Journey (SLJ)</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                <Link href="/journey" className="hover:text-navy-900 transition-colors">PTP Contract</Link>
                <Link href="/profile" className="hover:text-navy-900 transition-colors">Profil Peserta</Link>
                <span>&copy; {new Date().getFullYear()} BinaHub</span>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* ─── MOBILE BOTTOM DOCK NAVIGATION (Fixed at Bottom on Mobile) ─── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-warm-border px-2 py-1.5 items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? "text-[#0B2C6B] font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${isActive ? "text-[#C79A3C]" : "text-slate-400"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
