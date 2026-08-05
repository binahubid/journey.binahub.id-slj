"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Send } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { DetailHeader, ScoreBar, SectionHeading } from "@/components/coach/CoachUi";
import { loadParticipantAssessment, saveCoachAssessment, type CoachDataMode, type CoachAssessment, type CoachPortalParticipant } from "@/lib/coach-data";
import { coachAssessmentRubric } from "@/lib/assessment-methodology";
import { useParams } from "next/navigation";

const statusLabels: Record<string, string> = { BELUM_DITINJAU: "Belum ditinjau", TERVERIFIKASI: "Terverifikasi", PERLU_KLARIFIKASI: "Perlu klarifikasi", TIDAK_DAPAT_DIVERIFIKASI: "Tidak dapat diverifikasi" };

export default function CoachParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [participant, setParticipant] = useState<CoachPortalParticipant | null>(null);
  const [assessment, setAssessment] = useState<CoachAssessment | null>(null);
  const [mode, setMode] = useState<CoachDataMode>("live");
  const [viewerName, setViewerName] = useState("Coach");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadParticipantAssessment(id).then((result) => { setParticipant(result.data.participant); setAssessment(result.data.assessment); setMode(result.mode); setViewerName(result.viewer.name); setNote(result.data.assessment.evidenceNote); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Detail peserta gagal dimuat.")).finally(() => setLoading(false)); }, [id]);
  if (loading) return <CoachLayout pageTitle="Detail Peserta"><div className="p-10 text-center text-sm text-slate-500">Memuat assessment peserta...</div></CoachLayout>;
  if (error || !participant || !assessment) return <CoachLayout pageTitle="Detail Peserta" viewerName={viewerName}><div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error || "Peserta tidak ditemukan."}</div></CoachLayout>;

  const scores = assessment.scores;
  const save = async () => {
    if (mode === "preview") return;
    if (!participant.journeyId || assessment.participantOutcome === null) { setError("Journey atau Participant Outcome live belum tersedia; assessment belum dapat disimpan."); return; }
    setSaving(true); setError(""); setMessage("");
    try { await saveCoachAssessment({ participantUserId: participant.participantUserId, journeyId: participant.journeyId, participantOutcome: assessment.participantOutcome, validationStatus: assessment.validationStatus, evidenceNote: note, scores }); setMessage("Assessment tersimpan."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Assessment gagal disimpan."); } finally { setSaving(false); }
  };

  return <CoachLayout pageTitle="Detail Peserta" backHref="/coach" viewerName={viewerName} mode={mode}>
    {mode === "preview" && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">PREVIEW MOCK: RPC assessment belum tersedia. Tidak ada data nyata dan tombol simpan dinonaktifkan.</div>}
    {error && <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}
    {message && <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{message}</div>}
    <DetailHeader participant={participant} />
    <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-7">
        <section className="space-y-5"><SectionHeading title="Ringkasan PTP" description="Arah perubahan yang disepakati peserta." action={<Link href={`/coach/participants/${id}/history`} className="inline-flex items-center gap-2 text-xs font-bold text-[#9A762C]"><History className="h-4 w-4" />Lihat riwayat</Link>} /><div className="grid gap-px overflow-hidden rounded-xl bg-[#E5E7EB] ring-1 ring-[#E5E7EB] md:grid-cols-2"><div className="bg-white p-5"><p className="text-[10px] font-bold text-slate-400">MUHASABAH</p><p className="mt-3 text-sm leading-relaxed text-slate-700">{participant.muhasabah || "Belum tersedia."}</p></div><div className="bg-white p-5"><p className="text-[10px] font-bold text-slate-400">NIAT PERUBAHAN</p><p className="mt-3 text-sm leading-relaxed text-[#0F1E3D]">{participant.niat || "Belum tersedia."}</p></div><div className="bg-white p-5 md:col-span-2"><p className="text-[10px] font-bold text-slate-400">TARGET UTAMA</p><p className="mt-3 text-base font-bold text-[#0F1E3D]">{participant.mainTarget || "Belum tersedia."}</p></div></div></section>
        <section className="space-y-5"><SectionHeading title="Skor Baseline" description="Data baseline dari peserta yang ditugaskan." /><div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">{Object.entries(participant.baseline).length ? Object.entries(participant.baseline).map(([label, value]) => <ScoreBar key={label} label={label} value={value} />) : <p className="text-sm text-slate-500">Baseline belum tersedia.</p>}</div></section>
        <section className="space-y-5"><SectionHeading title="Checkpoint & Catatan" /><div className="grid gap-4 lg:grid-cols-3">{participant.checkpoints.length ? participant.checkpoints.map((checkpoint) => <div key={checkpoint.month} className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]"><p className="text-[10px] font-bold text-slate-400">BULAN {checkpoint.month}</p><p className="mt-3 text-xs text-slate-600">{checkpoint.participantNote || "Belum ada catatan."}</p></div>) : <p className="text-sm text-slate-500">Checkpoint belum tersedia.</p>}</div></section>
      </div>
      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start"><div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]"><p className="text-[10px] font-bold uppercase tracking-wide text-[#9A762C]">Coach Assessment</p><div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-[#E5E7EB]"><div className="bg-[#FAF8F4] p-3 text-center"><p className="text-[9px] font-bold text-slate-400">PARTICIPANT OUTCOME</p><p className="mt-1 text-xl font-black text-[#0F1E3D]">{assessment.participantOutcome ?? "-"}</p></div><div className="bg-[#FAF8F4] p-3 text-center"><p className="text-[9px] font-bold text-slate-400">COACH</p><p className="mt-1 text-xl font-black text-[#0F1E3D]">{assessment.coachScore ?? "-"}</p></div><div className="bg-[#0F1E3D] p-3 text-center"><p className="text-[9px] font-bold text-slate-400">VALIDATED</p><p className="mt-1 text-xl font-black text-amber-300">{assessment.validatedOutcome ?? "-"}</p></div></div><div className="mt-5 space-y-4">{coachAssessmentRubric.map((rubric, index) => <div key={rubric.label}><div className="flex justify-between text-xs font-bold text-[#0F1E3D]"><span>{rubric.label}</span><span>{scores[index]}/5</span></div><div className="mt-2 grid grid-cols-5 gap-1">{[1, 2, 3, 4, 5].map((score) => <button disabled={mode === "preview"} key={score} type="button" onClick={() => setAssessment({ ...assessment, scores: scores.map((value, scoreIndex) => scoreIndex === index ? score : value) })} className={`h-8 rounded-md text-[10px] font-bold ${scores[index] === score ? "bg-[#0F1E3D] text-white" : "bg-slate-100 text-slate-500"}`}>{score}</button>)}</div></div>)}</div><label className="mt-5 block text-[10px] font-bold text-slate-500">STATUS VALIDASI<select disabled={mode === "preview"} value={assessment.validationStatus} onChange={(event) => setAssessment({ ...assessment, validationStatus: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-slate-700">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-4 block text-[10px] font-bold text-slate-500">CATATAN BUKTI<textarea disabled={mode === "preview"} value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-[#E5E7EB] p-3 text-xs" /></label><button disabled={saving || mode === "preview"} onClick={save} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F1E3D] text-xs font-bold text-white disabled:opacity-40">{saving ? "Menyimpan..." : "Simpan assessment"}<Send className="h-3.5 w-3.5" /></button></div></aside>
    </div>
  </CoachLayout>;
}
