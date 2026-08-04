"use client";

import { notFound, useParams } from "next/navigation";
import { CheckCircle2, FileClock, MessageSquareText } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { DetailHeader, SectionHeading } from "@/components/coach/CoachUi";
import { getCoachParticipant } from "@/lib/coach-mock-data";

export default function CoachParticipantHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const participant = getCoachParticipant(id);
  if (!participant) notFound();

  const events = [
    ...participant.ptpSnapshots.map((snapshot) => ({ date: snapshot.date, title: `${snapshot.version} · ${snapshot.status}`, body: snapshot.note, type: "PTP" })),
    ...participant.checkpoints.filter((item) => item.date).map((checkpoint) => ({ date: checkpoint.date!, title: `Checkpoint Bulan ${checkpoint.month}`, body: checkpoint.participantNote || "Checkpoint diselesaikan.", type: "CHECKPOINT" })),
  ];

  return (
    <CoachLayout pageTitle="Riwayat Peserta" backHref={`/coach/participants/${participant.id}`}>
      <DetailHeader participant={participant} />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5"><SectionHeading title="Jejak Perjalanan" description="Perubahan PTP, checkpoint, dan momen pendampingan penting." /><div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB] sm:p-7"><div className="relative space-y-7 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[#E5E7EB]">{events.map((event, index) => <article key={`${event.date}-${event.title}`} className="relative flex gap-4"><div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF8F4] ring-1 ring-[#E5E7EB]">{event.type === "PTP" ? <FileClock className="h-3.5 w-3.5 text-[#C79A3C]" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}</div><div className="min-w-0 flex-1 pb-1"><p className="text-[10px] font-bold text-slate-400">{event.date}</p><h3 className="mt-1 text-sm font-bold text-[#0F1E3D]">{event.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">{event.body}</p>{index === 0 && <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Aktivitas terbaru</span>}</div></article>)}</div></div></section>
        <aside className="space-y-5"><div className="rounded-xl bg-[#0F1E3D] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">Evolusi PTP</p><p className="mt-3 text-3xl font-black">{participant.ptpSnapshots.length}</p><p className="mt-1 text-xs text-slate-400">versi terdokumentasi</p></div><div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#C79A3C]" /><h2 className="text-sm font-bold text-[#0F1E3D]">Arsip respons coach</h2></div><div className="mt-4 divide-y divide-[#E5E7EB]">{participant.checkpoints.filter((checkpoint) => checkpoint.coachNote).map((checkpoint) => <div key={checkpoint.month} className="py-4 first:pt-0 last:pb-0"><p className="text-[10px] font-bold text-slate-400">CHECKPOINT {checkpoint.month}</p><p className="mt-2 text-xs leading-relaxed text-slate-600">{checkpoint.coachNote}</p></div>)}</div></div></aside>
      </div>
    </CoachLayout>
  );
}
