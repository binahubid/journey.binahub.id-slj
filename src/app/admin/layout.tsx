"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  BarChart3,
  HeartHandshake,
  ScrollText,
  BookOpenCheck,
  Menu,
  Compass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const groups = [
  {
    title: "Program & peserta",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
      { href: "/admin/companies", label: "Organisasi", icon: Building2 },
      { href: "/admin/batches", label: "Batch program", icon: Layers },
      { href: "/admin/participants", label: "Peserta", icon: Users },
      { href: "/admin/trials", label: "Uji coba spiritual", icon: Compass },
      {
        href: "/admin/sahabat-safar",
        label: "Sahabat Safar",
        icon: HeartHandshake,
      },
      { href: "/admin/coaches", label: "Coach pendamping", icon: UserCheck },
    ],
  },
  {
    title: "Pemantauan",
    items: [
      { href: "/admin/monitoring", label: "Progres peserta", icon: Activity },
      { href: "/admin/report", label: "Laporan dampak", icon: BarChart3 },
      { href: "/admin/notifications", label: "Notifikasi", icon: Bell },
      { href: "/admin/audit", label: "Riwayat perubahan", icon: ScrollText },
    ],
  },
  {
    title: "Bantuan & pengaturan",
    items: [
      {
        href: "/admin/documentation",
        label: "Panduan admin",
        icon: BookOpenCheck,
      },
      { href: "/admin/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const selected = (href: string) =>
    pathname === href ||
    (href !== "/admin" && pathname?.startsWith(href + "/"));
  const title =
    groups.flatMap((group) => group.items).find((item) => selected(item.href))
      ?.label || "Admin SLJ";
  const navigation = (
    <nav
      aria-label="Menu admin"
      className="min-h-0 flex-1 space-y-6 overflow-y-auto py-3"
    >
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
                aria-current={selected(item.href) ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${selected(item.href) ? "bg-blue-50 font-semibold text-navy-900" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <item.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("slj_current_access_code");
    router.replace("/login");
    router.refresh();
  }
  const footer = (
    <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
      <Link
        href="/company"
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-slate-600 hover:bg-slate-50"
      >
        <ShieldCheck className="h-[18px] w-[18px]" />
        Portal organisasi
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-700 hover:bg-red-50"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Keluar
      </button>
    </div>
  );
  return (
    <div className="flex min-h-dvh bg-[#F5F7FB] font-sans text-navy-900">
      <a
        href="#admin-content"
        className="sr-only z-[400] bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Langsung ke isi halaman
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <Link href="/admin" className="mb-5 flex min-h-11 items-center px-3">
          <img
            src="/BinaJourney_logo.webp"
            alt="BinaJourney"
            className="h-8 w-auto"
          />
        </Link>
        {navigation}
        {footer}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
                  aria-label="Buka menu admin"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="left-0 top-0 flex h-dvh max-h-dvh w-[min(21rem,90vw)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-y-0 border-l-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
                <DialogTitle className="mb-3 flex min-h-11 items-center">
                  <img
                    src="/BinaJourney_logo.webp"
                    alt="Menu admin BinaJourney"
                    className="h-8 w-auto"
                  />
                </DialogTitle>
                {navigation}
                {footer}
              </DialogContent>
            </Dialog>
            <span className="truncate text-sm font-medium">{title}</span>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-navy-900">
            Admin SLJ
          </span>
        </header>
        <main
          id="admin-content"
          className="p-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
