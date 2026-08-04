import Link from "next/link";
import { AlertCircle, ArrowUpRight, Clock3 } from "lucide-react";
import { CoachParticipant, getCoachAlert, journeyStatusLabels } from "@/lib/coach-mock-data";

export function AlertBadge({ participant }: { participant: CoachParticipant }) {
  const alert = getCoachAlert(participant);
  if (!alert) return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Stabil</span>;
  const danger = alert.type === "INACTIVE" || alert.type === "COACH_ACTION_NEEDED";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${danger ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}><AlertCircle className="h-3 w-3" />{alert.label}</span>;
}

export function HabitBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-[#C79A3C]" : "bg-rose-500";
  return <div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div><span className="text-xs font-bold tabular-nums text-[#0F1E3D]">{value}%</span></div>;
}

export function ParticipantRow({ participant }: { participant: CoachParticipant }) {
  return (
    <Link href={`/coach/participants/${participant.id}`} className="group grid min-w-[920px] grid-cols-[minmax(220px,1.5fr)_90px_140px_150px_145px_130px_34px] items-center gap-4 border-t border-[#E5E7EB] px-5 py-4 transition-colors hover:bg-[#FAF8F4]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F1E3D] text-xs font-bold text-amber-300">{participant.initials}</div>
        <div className="min-w-0"><p className="truncate text-sm font-bold text-[#0F1E3D]">{participant.fullName}</p><p className="truncate text-[11px] text-slate-500">{participant.batch}</p></div>
      </div>
      <span className="text-xs font-bold text-[#0F1E3D]">Hari {participant.dayCount}</span>
      <span className="text-xs font-medium text-slate-600">{journeyStatusLabels[participant.journeyStatus]}</span>
      <HabitBar value={participant.habitCompletionPercent} />
      <span className="text-xs text-slate-600">{participant.lastCheckpointStatus === "ON_TRACK" ? "On track" : participant.lastCheckpointStatus === "NEED_SUPPORT" ? "Butuh dukungan" : "Belum diisi"}</span>
      <div><AlertBadge participant={participant} /></div>
      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#C79A3C]" />
    </Link>
  );
}

export function DetailHeader({ participant }: { participant: CoachParticipant }) {
  return (
    <div className="border-b border-[#E5E7EB] pb-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0F1E3D] text-base font-black text-amber-300">{participant.initials}</div>
          <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-black tracking-tight text-[#0F1E3D]">{participant.fullName}</h1><AlertBadge participant={participant} /></div><p className="text-sm text-slate-500">{participant.company} · {participant.batch} · {participant.city}</p></div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span><b className="text-[#0F1E3D]">Hari {participant.dayCount}</b> dari 90</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Aktif {participant.lastActive}</span></div>
      </div>
    </div>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-base font-extrabold text-[#0F1E3D]">{title}</h2>{description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">{description}</p>}</div>{action}</div>;
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="grid gap-2 sm:grid-cols-[190px_1fr_44px] sm:items-center"><span className="text-xs font-semibold text-slate-600">{label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#C79A3C]" style={{ width: `${value}%` }} /></div><span className="text-right text-xs font-black tabular-nums text-[#0F1E3D]">{value}</span></div>;
}
