"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarCheck, Search, Users } from "lucide-react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { ParticipantRow } from "@/components/coach/CoachUi";
import { getCoachAlert, journeyStatusLabels } from "@/lib/coach-mock-data";
import { loadCoachParticipants, type CoachPortalParticipant, type CoachDataMode } from "@/lib/coach-data";
import { JourneyStatus } from "@/types/slj";

export default function CoachDashboardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | JourneyStatus>("ALL");
  const [flagOnly, setFlagOnly] = useState(false);
  const [participants, setParticipants] = useState<CoachPortalParticipant[]>([]);
  const [mode, setMode] = useState<CoachDataMode>("live");
  const [viewerName, setViewerName] = useState("Coach");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCoachParticipants().then((result) => { setParticipants(result.data); setMode(result.mode); setViewerName(result.viewer.name); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Data peserta gagal dimuat.")).finally(() => setLoading(false));
  }, []);

  const prioritized = useMemo(() => participants.map((participant) => ({ participant, alert: getCoachAlert(participant) })).sort((a, b) => Number(Boolean(b.alert)) - Number(Boolean(a.alert))), [participants]);
  const filtered = prioritized.filter(({ participant, alert }) => {
    const matchesSearch = `${participant.fullName} ${participant.batch}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "ALL" || participant.journeyStatus === status;
    return matchesSearch && matchesStatus && (!flagOnly || Boolean(alert));
  });
  const alertCount = prioritized.filter((item) => item.alert).length;
  const supportCount = prioritized.filter((item) => item.alert?.type === "COACH_ACTION_NEEDED" || item.alert?.type === "INACTIVE").length;
  const averageHabit = participants.length ? Math.round(participants.reduce((sum, item) => sum + item.habitCompletionPercent, 0) / participants.length) : 0;

  return (
    <CoachLayout pageTitle="Coach Command Center" viewerName={viewerName} mode={mode}>
      {mode === "preview" && <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">PREVIEW MOCK: RPC live belum tersedia. Data ini bukan data peserta nyata dan tidak dapat disimpan.</div>}
      {loading && <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 ring-1 ring-[#E5E7EB]">Memuat peserta yang ditugaskan...</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>}
      <section className="border-b border-[#E5E7EB] pb-7">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-[#9A762C]">Selasa, 4 Agustus 2026</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#0F1E3D] sm:text-4xl">Prioritaskan pendampingan yang paling berarti.</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">Pantau ritme peserta, tangani sinyal risiko, dan siapkan percakapan coaching dari satu ruang kerja.</p>
          </div>
          <Link href="#participants" className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F1E3D] px-5 text-xs font-bold text-white transition-transform active:scale-[0.98] sm:w-auto">Buka daftar prioritas<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-xl bg-[#E5E7EB] ring-1 ring-[#E5E7EB] sm:grid-cols-2 xl:grid-cols-4 mt-6">
        {[
           { label: "Peserta bimbingan", value: participants.length, detail: "Data yang ditugaskan", icon: Users },
          { label: "Flag aktif", value: alertCount, detail: "Perlu ditinjau", icon: AlertTriangle },
          { label: "Aksi prioritas", value: supportCount, detail: "Hari ini", icon: CalendarCheck },
          { label: "Rata-rata habit", value: `${averageHabit}%`, detail: "7 hari terakhir", icon: null },
        ].map((metric) => {
          const Icon = metric.icon;
          return <div key={metric.label} className="bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-slate-500">{metric.label}</p><p className="mt-3 text-3xl font-black tabular-nums tracking-tight text-[#0F1E3D]">{metric.value}</p><p className="mt-1 text-[10px] text-slate-400">{metric.detail}</p></div>{Icon && <Icon className="h-4 w-4 text-[#C79A3C]" />}</div></div>;
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_310px]">
        <div id="participants" className="min-w-0 scroll-mt-24 overflow-hidden rounded-xl bg-white ring-1 ring-[#E5E7EB]">
          <div className="p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div><h2 className="text-base font-extrabold text-[#0F1E3D]">Peserta bimbingan</h2><p className="mt-1 text-xs text-slate-500">Flag aktif ditempatkan paling atas.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari peserta" className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#C79A3C] sm:w-48" /></label>
                <select value={status} onChange={(event) => setStatus(event.target.value as "ALL" | JourneyStatus)} className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#C79A3C]">
                  <option value="ALL">Semua status</option>{Object.values(JourneyStatus).map((value) => <option key={value} value={value}>{journeyStatusLabels[value]}</option>)}
                </select>
                <button onClick={() => setFlagOnly((current) => !current)} className={`h-10 rounded-lg border px-3 text-xs font-bold transition-colors ${flagOnly ? "border-[#0F1E3D] bg-[#0F1E3D] text-white" : "border-[#E5E7EB] text-slate-600 hover:bg-slate-50"}`}>Hanya flag</button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[920px] grid-cols-[minmax(220px,1.5fr)_90px_140px_150px_145px_130px_34px] gap-4 border-t border-[#E5E7EB] bg-slate-50/70 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>Peserta</span><span>Progres</span><span>Status</span><span>Habit 7 hari</span><span>Checkpoint</span><span>Flag</span><span /></div>
            {filtered.length ? filtered.map(({ participant }) => <ParticipantRow key={participant.id} participant={participant} />) : <div className="border-t border-[#E5E7EB] p-10 text-center text-sm text-slate-500">Tidak ada peserta sesuai filter.</div>}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl bg-[#0F1E3D] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">Fokus hari ini</p>
            <h2 className="mt-3 text-lg font-bold leading-snug">Mulai dari peserta yang kehilangan ritme.</h2>
            <div className="mt-5 space-y-3">
              {prioritized.filter((item) => item.alert).slice(0, 3).map(({ participant, alert }, index) => <Link key={participant.id} href={`/coach/participants/${participant.id}`} className="group flex items-start gap-3 border-t border-white/10 pt-3 first:border-0 first:pt-0"><span className="text-xs font-black text-amber-300">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{participant.fullName}</p><p className="mt-0.5 text-[10px] text-slate-400">{alert?.label}</p></div><ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-300" /></Link>)}
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]"><p className="text-xs font-bold text-[#0F1E3D]">Agenda pendampingan</p><div className="mt-4 space-y-4"><div><p className="text-[10px] font-bold text-[#9A762C]">10.00 WIB</p><p className="mt-1 text-xs font-semibold text-slate-700">Checkpoint Ahmad Fauzan</p></div><div className="border-t border-[#E5E7EB] pt-4"><p className="text-[10px] font-bold text-[#9A762C]">15.30 WIB</p><p className="mt-1 text-xs font-semibold text-slate-700">Review batch Leadership B</p></div></div></div>
        </aside>
      </section>
    </CoachLayout>
  );
}
