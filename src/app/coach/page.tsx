"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { ParticipantRow } from "@/components/coach/CoachUi";
import { getCoachAlert, journeyStatusLabels } from "@/lib/coach-mock-data";
import { loadCoachParticipants, type CoachPortalParticipant, type CoachDataMode } from "@/lib/coach-data";
import { JourneyStatus } from "@/types/slj";

export default function CoachDashboardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [flagOnly, setFlagOnly] = useState(false);
  const [participants, setParticipants] = useState<CoachPortalParticipant[]>([]);
  const [mode, setMode] = useState<CoachDataMode>("live");
  const [viewerName, setViewerName] = useState("Coach");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCoachParticipants()
      .then((result) => {
        setParticipants(result.data);
        setMode(result.mode);
        setViewerName(result.viewer.name);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Data peserta gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const query = search.trim().toLowerCase();
  const rows = participants.map((participant) => ({ participant, alert: getCoachAlert(participant) }));
  const alertCount = rows.filter(({ alert }) => alert).length;
  const filtered = rows
    .filter(({ participant, alert }) => {
      const matchesSearch = [participant.fullName, participant.batch, participant.company].some((name) => name.toLowerCase().includes(query));
      return matchesSearch && (status === "ALL" || participant.journeyStatus === status) && (!flagOnly || Boolean(alert));
    })
    .sort((a, b) => Number(Boolean(b.alert)) - Number(Boolean(a.alert)));

  return (
    <CoachLayout pageTitle="Ruang Coach" viewerName={viewerName} mode={mode}>
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Pendampingan peserta</h1>
      <p className="mt-2 text-sm text-slate-600">Tinjau progres peserta dan buka penilaian dari daftar ini.</p>
      {mode === "preview" && <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">Data contoh. Penyimpanan dinonaktifkan.</p>}
      {loading ? (
        <p role="status" className="mt-5 rounded-xl bg-white p-5 text-sm text-slate-600">Memuat peserta ...</p>
      ) : error ? (
        <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-5 text-sm text-rose-700">{error}</p>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-sm text-slate-600">Peserta bimbingan</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">{participants.length}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-sm text-slate-600">Perlu perhatian</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">{alertCount}</dd>
            </div>
          </dl>

          <section id="participants" className="mt-6 scroll-mt-24 rounded-xl border border-slate-200 bg-white">
            <div className="space-y-4 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-navy-900">Daftar peserta</h2>
              <div className="flex flex-wrap gap-2">
                <label className="relative w-full sm:max-w-60">
                  <span className="sr-only">Cari peserta</span>
                  <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-slate-500" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari peserta" className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm" />
                </label>
                <select aria-label="Status perjalanan" value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  <option value="ALL">Semua status</option>
                  {Object.values(JourneyStatus).map((value) => <option key={value} value={value}>{journeyStatusLabels[value]}</option>)}
                </select>
                <button type="button" aria-pressed={flagOnly} onClick={() => setFlagOnly((current) => !current)} className={`min-h-11 rounded-lg border px-3 text-sm font-medium ${flagOnly ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  Perlu perhatian
                </button>
              </div>
            </div>
            {filtered.length > 0 ? (
              <ul className="divide-y divide-slate-200 border-t border-slate-200">
                {filtered.map(({ participant }) => <li key={participant.id}><ParticipantRow participant={participant} /></li>)}
              </ul>
            ) : <p className="border-t border-slate-200 p-5 text-sm text-slate-600">{participants.length ? "Tidak ada peserta sesuai filter." : "Belum ada peserta bimbingan."}</p>}
          </section>
        </>
      )}
    </CoachLayout>
  );
}
