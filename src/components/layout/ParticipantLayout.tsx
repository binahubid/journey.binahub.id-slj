"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  TrendingUp,
  UserRound,
  Settings,
  Bell,
  Menu,
  LogOut,
  ArrowLeft,
  Brain,
  Sparkles,
  CircleHelp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSljAccess } from "@/lib/program-access";
import { usePwaInstall } from "@/components/pwa/PwaProvider";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ParticipantLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  pageTitle?: string;
  hideBackToHome?: boolean;
  noPadding?: boolean;
  hideFooter?: boolean;
  trialExpired?: boolean;
}

export function ParticipantLayout({
  children,
  activePath,
  pageTitle,
  hideBackToHome = false,
  noPadding = false,
  hideFooter = false,
  trialExpired = false,
}: ParticipantLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { updateBadge } = usePwaInstall();
  const current = activePath || pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Peserta");
  const [isTrial, setIsTrial] = useState(pathname === "/trial");
  const [isExpired, setIsExpired] = useState(trialExpired);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    updateBadge(unread);
  }, [unread, updateBadge]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);
      if (cancelled) return;
      setUserName(profile?.full_name || user.email?.split("@")[0] || "Peserta");
      setUnread(count || 0);
      try {
        const access = await getSljAccess(supabase);
        if (!cancelled && access) {
          setIsTrial(access.kind === "trial");
          setIsExpired(access.kind === "trial" && !access.active);
        }
      } catch {
        /* Middleware handles access failures before private pages are rendered. */
      }
    }
    void load();
    const focus = () => {
      void load();
    };
    const message = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_BADGE") void load();
    };
    window.addEventListener("focus", focus);
    navigator.serviceWorker?.addEventListener("message", message);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", focus);
      navigator.serviceWorker?.removeEventListener("message", message);
    };
  }, [supabase]);

  const home = isTrial ? "/trial" : "/dashboard";
  const nav = [
    { href: home, label: "Beranda", icon: LayoutDashboard },
    { href: "/journey", label: "Rencana perubahan", icon: Compass },
    { href: "/monitoring", label: "Progres & evaluasi", icon: TrendingUp },
    { href: "/journal", label: "Jurnal refleksi", icon: BookOpen },
    { href: "/initial-process", label: "Persiapan perjalanan", icon: Sparkles },
    { href: "/baseline", label: "Kenali diri", icon: Brain },
    { href: "/panduan", label: "Panduan", icon: CircleHelp },
  ];
  const bottomNav = [
    { href: home, label: "Beranda", icon: LayoutDashboard },
    { href: "/journey", label: "Rencana", icon: Compass },
    { href: "/monitoring", label: "Progres", icon: TrendingUp },
    { href: "/journal", label: "Jurnal", icon: BookOpen },
    { href: "/profile", label: "Profil", icon: UserRound },
  ];
  const canPractice = !isTrial || (!isExpired && !trialExpired);
  const showDock = !current?.startsWith("/baseline");
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  const navigation = (
    <nav aria-label="Menu peserta" className="space-y-1">
      {nav.filter(item => canPractice || item.href === home || item.href === "/panduan").map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          aria-current={current === item.href ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${current === item.href ? "bg-blue-50 font-semibold text-navy-900" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <item.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
  const secondary = (
    <div className="space-y-1 border-t border-slate-100 pt-4">
      <Link
        href="/settings"
        onClick={() => setMenuOpen(false)}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-slate-600 hover:bg-slate-50"
      >
        <Settings className="h-[18px] w-[18px]" />
        Pengaturan
      </Link>
      <Link
        href="/terms"
        onClick={() => setMenuOpen(false)}
        className="flex min-h-11 items-center px-3 text-xs text-slate-600"
      >
        Syarat & privasi
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-700 hover:bg-red-50"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Keluar
      </button>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-[#F5F7FB] font-sans text-navy-900">
      <a
        href="#participant-content"
        className="sr-only z-[400] rounded-lg bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Langsung ke isi halaman
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between gap-7 overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
        <div>
          <Link
            href={home}
            className="mb-8 inline-flex min-h-11 items-center px-2"
          >
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney"
              className="h-8 w-auto"
            />
          </Link>
          {navigation}
        </div>
        {secondary}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Buka menu peserta"
                  className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="left-0 top-0 flex h-dvh max-h-dvh w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 flex-col justify-between rounded-none border-y-0 border-l-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
                <div>
                  <DialogTitle className="mb-6 flex min-h-11 items-center">
                    <img
                      src="/BinaJourney_logo.webp"
                      alt="Menu BinaJourney"
                      className="h-8 w-auto"
                    />
                  </DialogTitle>
                  <p className="mb-1 break-words px-3 text-sm font-semibold">
                    {userName}
                  </p>
                  <p className="mb-6 px-3 text-xs text-slate-600">
                    {isTrial
                      ? "Uji coba spiritual · 14 hari"
                      : "Spiritual Leadership Journey"}
                  </p>
                  {navigation}
                </div>
                {secondary}
              </DialogContent>
            </Dialog>
            <Link
              href={home}
              className="inline-flex min-h-11 items-center lg:hidden"
            >
              <img
                src="/BinaJourney_logo.webp"
                alt="BinaJourney"
                className="h-7 w-auto"
              />
            </Link>
            <p className="hidden truncate text-sm font-medium text-slate-600 lg:block">
              {pageTitle || "Spiritual Leadership Journey"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/notifications"
              aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy-900 px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              aria-label="Profil saya"
              className="flex min-h-11 items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-navy-900">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-48 truncate text-sm font-medium sm:block">
                {userName}
              </span>
            </Link>
          </div>
        </header>
        <main
          id="participant-content"
          className={`${noPadding ? "" : "p-4 sm:p-6 lg:p-8"} ${showDock ? "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8" : ""}`}
        >
          {!hideBackToHome && current !== home && (
            <Link
              href={home}
              className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke beranda
            </Link>
          )}
          {children}
        </main>
        {!hideFooter && (
          <footer className="hidden items-center justify-between gap-3 border-t border-slate-200 px-8 py-5 text-xs text-slate-600 lg:flex">
            <span>© {new Date().getFullYear()} BinaHub</span>
            <Link href="/panduan" className="underline underline-offset-4">
              Panduan penggunaan
            </Link>
          </footer>
        )}
      </div>
      {showDock && (
        <nav
          aria-label="Navigasi utama"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-sm lg:hidden"
        >
          {bottomNav.filter(item => canPractice || item.href === home || item.href === "/profile").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current === item.href ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] ${current === item.href ? "font-semibold text-navy-900" : "text-slate-600"}`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full ${current === item.href ? "bg-blue-50" : ""}`}
              >
                <item.icon aria-hidden className="h-5 w-5" />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
