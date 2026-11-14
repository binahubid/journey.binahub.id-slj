import Link from "next/link";
import { AlertCircle, ArrowUpRight, Clock3 } from "lucide-react";
import { CoachParticipant, getCoachAlert, journeyStatusLabels } from "@/lib/coach-mock-data";

export function AlertBadge({ participant }: { participant: CoachParticipant }) {
  const alert = getCoachAlert(participant);
  if (!alert) return null;
  const danger = alert.type === "INACTIVE" || alert.type === "COACH_ACTION_NEEDED";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${danger ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>
      <AlertCircle aria-hidden="true" className="size-3" />
      {alert.label}
    </span>
  );
}

export function ParticipantRow({ participant }: { participant: CoachParticipant }) {
  const label = participant.journeyStatus ? journeyStatusLabels[participant.journeyStatus] : "Belum memulai perjalanan";
  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-amber-200" aria-hidden="true">{participant.initials}</div>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-navy-900">{participant.fullName}</p>
          <p className="mt-0.5 break-words text-xs text-slate-600">{[participant.batch, participant.company].filter((value) => value !== "-").join(" · ") || label}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {participant.journeyStatus && <span className="text-xs font-medium text-slate-600">{label}</span>}
        <AlertBadge participant={participant} />
      </div>
    </>
  );

  return participant.journeyStatus ? (
    <Link href={`/coach/participants/${participant.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-900 sm:px-5">
      {content}
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-slate-500 group-hover:text-navy-900" />
    </Link>
  ) : <div className="flex flex-wrap items-center gap-2 px-4 py-3.5 sm:px-5">{content}</div>;
}

export function DetailHeader({ participant }: { participant: CoachParticipant }) {
  return (
    <div className="border-b border-[#E5E7EB] pb-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0F1E3D] text-base font-black text-amber-300">{participant.initials}</div>
          <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><h1 className="break-words text-2xl font-semibold tracking-tight text-[#0F1E3D]">{participant.fullName}</h1><AlertBadge participant={participant} /></div><p className="text-sm text-slate-600">{participant.company} · {participant.batch} · {participant.city}</p></div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          {participant.dayCount !== null && (
            <span>{participant.dayCount === 0 ? "Program belum dimulai" : <>Hari <b className="text-navy-900">{participant.dayCount}</b> dari 90</>}</span>
          )}
          {participant.lastActive && <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4" />Aktif {participant.lastActive}</span>}
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-base font-extrabold text-[#0F1E3D]">{title}</h2>{description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">{description}</p>}</div>{action}</div>;
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="grid gap-2 sm:grid-cols-[190px_1fr_44px] sm:items-center"><span className="text-xs font-semibold text-slate-600">{label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#C79A3C]" style={{ width: `${value}%` }} /></div><span className="text-right text-xs font-black tabular-nums text-[#0F1E3D]">{value}</span></div>;
}
