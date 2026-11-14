"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { History } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { DetailHeader, ScoreBar, SectionHeading } from "@/components/coach/CoachUi";
import { loadParticipantAssessment, saveCoachAssessment, type CoachPortalResult, type CoachAssessment, type CoachPortalParticipant } from "@/lib/coach-data";
import { coachAssessmentRubric } from "@/lib/assessment-methodology";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = { BELUM_DITINJAU: "Belum ditinjau", TERVERIFIKASI: "Terverifikasi", PERLU_KLARIFIKASI: "Perlu klarifikasi", TIDAK_DAPAT_DIVERIFIKASI: "Tidak dapat diverifikasi" };
const formatScore = (score: number | null) => score === null || !Number.isFinite(score) ? "Belum terukur" : score + "%";

export default function CoachParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<CoachPortalResult<{ participant: CoachPortalParticipant; assessment: CoachAssessment }> | null>(null);
  const [draft, setDraft] = useState<CoachAssessment | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    loadParticipantAssessment(id).then((loaded) => {
      if (!active) return;
      setResult(loaded);
      setDraft(loaded.data.assessment);
    }).catch((reason) => {
      if (active) setLoadError(reason instanceof Error ? reason.message : "Detail peserta gagal dimuat.");
    });
    return () => { active = false; };
  }, [id]);

  if (!result || !draft) return (
    <CoachLayout pageTitle="Detail peserta" backHref="/coach">
      <p role={loadError ? "alert" : "status"} className="rounded-xl bg-white p-5 text-sm text-slate-700">{loadError || "Memuat hasil peserta ..."}</p>
    </CoachLayout>
  );
  const { participant } = result.data;
  const canEdit = result.mode === "live" && result.viewer.role === "coach" && draft.participantOutcome !== null && Boolean(participant.journeyId);
  const readyToSave = draft.scores.every((score) => Number.isInteger(score) && score >= 1 && score <= 5);
  const save = async () => {
    if (!canEdit || !readyToSave || saving || draft.participantOutcome === null || !participant.journeyId) return;
    setSaving(true);
    setEditorError("");
    setMessage("");
    try {
      const saved = await saveCoachAssessment({
        participantUserId: participant.participantUserId,
        journeyId: participant.journeyId,
        participantOutcome: draft.participantOutcome,
        validationStatus: draft.validationStatus,
        evidenceNote: draft.evidenceNote,
        scores: draft.scores,
      });
      setDraft({
        ...draft,
        coachScore: Number(saved.coach_score),
        validatedOutcome: Number(saved.validated_outcome),
      });
      setMessage("Penilaian tersimpan.");
    } catch {
      setEditorError("Penilaian gagal disimpan. Muat ulang bila hasil peserta baru berubah, atau coba simpan lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachLayout pageTitle="Detail peserta" backHref="/coach" viewerName={result.viewer.name} mode={result.mode}>
      <DetailHeader participant={participant} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-3">
            <SectionHeading title="Rencana transformasi" />
            <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4 sm:px-5">
              {[["Muhasabah", participant.muhasabah], ["Niat perubahan", participant.niat], ["Target utama", participant.mainTarget]].map(([label, value]) => (
                <div key={label} className="py-4">
                  <dt className="text-sm font-semibold text-navy-900">{label}</dt>
                  <dd className="mt-1 break-words text-sm leading-relaxed text-slate-600">{value || "Belum diisi."}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Capaian dan pelaksanaan" />
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4 sm:px-5">
              {participant.areaMetrics.length ? participant.areaMetrics.map((area) => (
                <div key={area.area} className="py-4">
                  <h3 className="text-sm font-semibold text-navy-900">{area.area}</h3>
                  <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-slate-600">Capaian target</dt><dd className="font-semibold text-navy-900">{formatScore(area.outcome)}</dd></div>
                    <div><dt className="text-slate-600">Pelaksanaan</dt><dd className="font-semibold text-navy-900">{formatScore(area.execution)}</dd></div>
                  </dl>
                </div>
              )) : <p className="py-4 text-sm text-slate-600">Belum ada skor area.</p>}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Skor awal (baseline)" />
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              {Object.entries(participant.baseline).length ? Object.entries(participant.baseline).map(([label, value]) => (
                <ScoreBar key={label} label={label} value={value} />
              )) : <p className="text-sm text-slate-600">Baseline belum tersedia.</p>}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Checkpoint" action={<Link href={`/coach/participants/${id}/history`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-900 underline underline-offset-4"><History aria-hidden="true" className="size-4" />Lihat riwayat</Link>} />
            <div className="grid gap-3 sm:grid-cols-3">
              {participant.checkpoints.length ? participant.checkpoints.map((checkpoint) => (
                <article key={checkpoint.month} className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-navy-900">Bulan {checkpoint.month}</h3>
                  <p className="mt-2 break-words text-sm text-slate-600">{checkpoint.participantNote || "Belum ada catatan."}</p>
                </article>
              )) : <p className="text-sm text-slate-600">Belum ada checkpoint peserta.</p>}
            </div>
          </section>
        </div>

        <section className="min-w-0 self-start rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-semibold text-navy-900">Penilaian coach</h2>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            {[["Capaian peserta", draft.participantOutcome], ["Skor coach", draft.coachScore], ["Hasil validasi", draft.validatedOutcome]].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-2 py-3 text-center">
                <dt className="text-xs text-slate-600">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-navy-900">{formatScore(typeof value === "number" ? value : null)}</dd>
              </div>
            ))}
          </dl>
          {!canEdit && <p className="mt-4 text-sm text-slate-600">{result.mode === "preview" ? "Data contoh." : result.viewer.role === "admin" ? "Admin dapat meninjau penilaian." : "Penilaian tersedia setelah capaian peserta terukur."}</p>}
          <fieldset disabled={!canEdit || saving} className="mt-5 space-y-4">
            {coachAssessmentRubric.map((rubric, index) => (
              <div key={rubric.label} role="group" aria-label={rubric.label}>
                <p className="text-sm font-medium text-navy-900">{rubric.label}</p>
                <div className="mt-2 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button key={score} type="button" aria-label={rubric.label + ", " + score + " dari 5"} aria-pressed={draft.scores[index] === score}
                      onClick={() => setDraft({ ...draft, scores: draft.scores.map((value, k) => k === index ? score : value) })}
                      className={`min-h-11 rounded-lg text-sm font-semibold disabled:opacity-75 ${draft.scores[index] === score ? "bg-navy-900 text-white" : "bg-slate-100 text-navy-900"}`}>{score}</button>
                  ))}
                </div>
              </div>
            ))}
            <label className="block text-sm font-medium text-navy-900">Status validasi
              <select value={draft.validationStatus} onChange={(event) => setDraft({ ...draft, validationStatus: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy-900">Catatan bukti
              <textarea value={draft.evidenceNote} onChange={(event) => setDraft({ ...draft, evidenceNote: event.target.value })} rows={4} className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm" />
            </label>
          </fieldset>
          {canEdit && <Button type="button" onClick={save} disabled={saving || !readyToSave} className="mt-4 min-h-11 w-full">{saving ? "Menyimpan ..." : "Simpan penilaian"}</Button>}
          {editorError && <p role="alert" className="mt-3 text-sm text-rose-700">{editorError}</p>}
          {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
        </section>
      </div>
    </CoachLayout>
  );
}
