"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LayoutDashboard, Menu, PanelLeftClose, Users, X } from "lucide-react";
import { coachProfile } from "@/lib/coach-mock-data";

const navItems = [
  { href: "/coach", label: "Command Center", icon: LayoutDashboard },
  { href: "/coach#participants", label: "Peserta Bimbingan", icon: Users },
];

export function CoachLayout({ children, pageTitle, backHref }: { children: React.ReactNode; pageTitle: string; backHref?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111827] md:flex">
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-[#0F1E3D] p-5 text-white md:sticky md:top-0 md:flex">
        <div className="flex h-full flex-col">
          <Link href="/coach" className="inline-flex items-center px-2 py-1">
            <img src="/BinaJourney_logo.webp" alt="BinaJourney" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <div className="mt-8 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">Coach Portal</p>
            <p className="mt-1 text-sm font-semibold text-white">Command Center</p>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = item.href === "/coach" ? pathname === "/coach" : false;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-colors ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-amber-300" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C] text-xs font-black text-[#0F1E3D]">{coachProfile.initials}</div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{coachProfile.name}</p>
                <p className="truncate text-[10px] text-slate-400">{coachProfile.role}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 px-1 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              MVP Preview · Mock Data
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-[#0F1E3D]/60" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-[82%] max-w-xs bg-[#0F1E3D] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <img src="/BinaJourney_logo.webp" alt="BinaJourney" className="h-8 w-auto brightness-0 invert" />
              <button onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">Coach Portal</p>
            <nav className="mt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-200 hover:bg-white/10"><Icon className="h-4 w-4 text-amber-300" />{item.label}</Link>;
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0F1E3D] hover:bg-slate-100 md:hidden" aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
            {backHref && <Link href={backHref} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 sm:flex" aria-label="Kembali"><PanelLeftClose className="h-4 w-4" /></Link>}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0F1E3D]">{pageTitle}</p>
              <p className="hidden text-[10px] text-slate-500 sm:block">{coachProfile.cohort}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Notifikasi"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C79A3C] ring-2 ring-white" /></button>
            <div className="hidden items-center gap-2 pl-1 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1E3D] text-xs font-bold text-amber-300">{coachProfile.initials}</div>
              <ChevronRight className="h-3.5 w-3.5 rotate-90 text-slate-400" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 pb-12 md:p-8">{children}</main>
      </div>
    </div>
  );
}
