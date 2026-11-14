"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Menu, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const navItems = [
  { href: "/coach", label: "Beranda coach", icon: LayoutDashboard },
  { href: "/coach#participants", label: "Daftar peserta", icon: Users },
];

export function CoachLayout({ children, pageTitle, backHref, viewerName = "Coach", mode = "live" }: { children: React.ReactNode; pageTitle: string; backHref?: string; viewerName?: string; mode?: "live" | "preview" }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const viewerInitials = viewerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F4] text-[#111827] md:flex">
      <aside aria-label="Navigasi coach" className="hidden h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-[#0F1E3D] p-5 text-white md:sticky md:top-0 md:flex">
        <div className="flex h-full flex-col">
          <Link href="/coach" className="inline-flex items-center px-2 py-1">
            <img src="/BinaJourney_logo.webp" alt="BinaJourney" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <nav aria-label="Menu coach" className="mt-6 space-y-1">
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
               <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C] text-xs font-black text-[#0F1E3D]">{viewerInitials}</div>
              <div className="min-w-0">
                 <p className="truncate text-xs font-bold">{viewerName}</p>
                 <p className="truncate text-[10px] text-slate-400">Coach Portal</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
              <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="flex size-11 items-center justify-center rounded-lg text-navy-900 hover:bg-slate-100" aria-label="Buka menu coach">
                    <Menu aria-hidden="true" className="size-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="left-0 top-0 h-dvh max-h-dvh w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0">
                  <DialogTitle className="mb-5 pr-11 text-xl font-semibold text-navy-900">Ruang Coach</DialogTitle>
                  <nav aria-label="Menu coach" className="space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-navy-900 hover:bg-slate-100">
                        <Icon aria-hidden="true" className="size-4" />
                        {label}
                      </Link>
                    ))}
                  </nav>
                </DialogContent>
              </Dialog>
            </div>
            {backHref && <Link href={backHref} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Kembali"><ArrowLeft aria-hidden="true" className="size-5" /></Link>}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0F1E3D]">{pageTitle}</p>
              {mode === "preview" && <p className="text-xs text-slate-600">Data contoh</p>}
            </div>
          </div>
          <span aria-label={viewerName} className="flex size-9 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-amber-200 md:hidden">{viewerInitials}</span>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 pb-12 md:p-8">{children}</main>
      </div>
    </div>
  );
}
