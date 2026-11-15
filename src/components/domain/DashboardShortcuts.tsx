"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DASHBOARD_WIDGETS = [
  { id: "prayer", label: "Jadwal salat" },
  { id: "habits", label: "Habit" },
  { id: "hadith", label: "Hadits" },
  { id: "quran", label: "Tilawah" },
  { id: "journal", label: "Jurnal" },
  { id: "analytics", label: "Analitik" },
] as const;

export type DashboardWidget = typeof DASHBOARD_WIDGETS[number]["id"];

export function DashboardShortcuts({ value, onChange }: {
  value: DashboardWidget;
  onChange: (value: DashboardWidget, animate: boolean) => void;
}) {
  return (
    <section id="dashboard-shortcuts" aria-label="Shortcut aktivitas" className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 lg:hidden">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-navy-900">Aktivitas Anda</h2>
        <Link href="/settings" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-navy-900">
          <Bell className="size-3.5" aria-hidden="true" /> Pengingat
        </Link>
      </div>
      <div role="group" aria-label="Pilih aktivitas" className="grid grid-cols-3 gap-2">
        {DASHBOARD_WIDGETS.map(widget => (
          <Button
            key={widget.id}
            type="button"
            variant="ghost"
            aria-pressed={value === widget.id}
            aria-controls={`dashboard-${widget.id}`}
            onClick={event => onChange(widget.id, event.detail > 0)}
            className={cn(
              "h-auto min-h-20 touch-manipulation flex-col gap-1 rounded-2xl border-0 p-2 text-xs font-medium transition-[transform,background-color] duration-150 active:scale-95 active:bg-blue-100 motion-reduce:transform-none",
              value === widget.id ? "bg-blue-50 text-navy-900 ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <span
              aria-hidden="true"
              className="size-14 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(/icons/dashboard/${widget.id}.webp)` }}
            />
            {widget.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
