"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, FileClock, MessageSquareText } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { DetailHeader, SectionHeading } from "@/components/coach/CoachUi";
import { loadParticipantAssessment, type CoachDataMode, type CoachPortalParticipant } from "@/lib/coach-data";

export default function CoachParticipantHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [participant, setParticipant] = useState<CoachPortalParticipant | null>(null);
  const [mode, setMode] = useState<CoachDataMode>("live");
  const [viewerName, setViewerName] = useState("Coach");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadParticipantAssessment(id).then((result) => { setParticipant(result.data.participant); setMode(result.mode); setViewerName(result.viewer.name); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Riwayat peserta gagal dimuat.")).finally(() => setLoading(false)); }, [id]);
  if (loading) return <CoachLayout pageTitle="Riwayat Peserta"><div className="p-10 text-center text-sm text-slate-500">Memuat riwayat peserta...</div></CoachLayout>;
  if (error || !participant) return <CoachLayout pageTitle="Riwayat Peserta" viewerName={viewerName}><div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error || "Peserta tidak ditemukan."}</div></CoachLayout>;

  const events = [
    ...participant.ptpSnapshots.map((snapshot) => ({ date: snapshot.date, title: `${snapshot.version} · ${snapshot.status}`, body: snapshot.note, type: "PTP" })),
    ...participant.checkpoints.filter((item) => item.date).map((checkpoint) => ({ date: checkpoint.date!, title: `Checkpoint Bulan ${checkpoint.month}`, body: checkpoint.participantNote || "Checkpoint diselesaikan.", type: "CHECKPOINT" })),
  ];

  return <CoachLayout pageTitle="Riwayat Peserta" backHref={`/coach/participants/${participant.id}`} viewerName={viewerName} mode={mode}>
    {mode === "preview" && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">PREVIEW MOCK: riwayat live belum tersedia.</div>}
    <DetailHeader participant={participant} />
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="space-y-5"><SectionHeading title="Jejak Perjalanan" description="Perubahan PTP dan checkpoint yang tersedia dari sumber peserta." /><div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB] sm:p-7">{events.length ? <div className="relative space-y-7">{events.map((event) => <article key={`${event.date}-${event.title}`} className="flex gap-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF8F4] ring-1 ring-[#E5E7EB]">{event.type === "PTP" ? <FileClock className="h-3.5 w-3.5 text-[#C79A3C]" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}</div><div><p className="text-[10px] font-bold text-slate-400">{event.date}</p><h3 className="mt-1 text-sm font-bold text-[#0F1E3D]">{event.title}</h3><p className="mt-2 text-xs text-slate-600">{event.body}</p></div></article>)}</div> : <p className="py-8 text-center text-sm text-slate-500">Belum ada riwayat yang tersedia.</p>}</div></section><aside><div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#C79A3C]" /><h2 className="text-sm font-bold text-[#0F1E3D]">Arsip respons coach</h2></div><div className="mt-4 divide-y divide-[#E5E7EB]">{participant.checkpoints.some((item) => item.coachNote) ? participant.checkpoints.filter((item) => item.coachNote).map((checkpoint) => <div key={checkpoint.month} className="py-4"><p className="text-[10px] font-bold text-slate-400">CHECKPOINT {checkpoint.month}</p><p className="mt-2 text-xs text-slate-600">{checkpoint.coachNote}</p></div>) : <p className="py-5 text-xs text-slate-500">Belum ada respons coach tersimpan.</p>}</div></div></aside></div>
  </CoachLayout>;
}
