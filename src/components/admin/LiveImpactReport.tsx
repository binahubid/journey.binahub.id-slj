"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, Lock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchCompaniesFromSupabase, fetchBatchesFromSupabase, formatSupabaseError, Company, Batch } from "@/lib/company-store";
import { GroupImpactReport, isAssessmentMigrationMissing, summarizeGroupImpact } from "@/lib/assessment-report";
import { DonutChart } from "@/components/domain/DonutChart";

interface OperationalRow {
  userId: string; journeyStatus: string; ptpStatus: string; daysInactive: number;
  monthsReviewed: number; needsSupport: boolean;
}

export function LiveImpactReport() {
  const supabase = createClient();
  const [report, setReport] = useState<GroupImpactReport | null>(null);
  const [operations, setOperations] = useState<OperationalRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [companyId, setCompanyId] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [compList, batchList] = await Promise.all([fetchCompaniesFromSupabase(), fetchBatchesFromSupabase()]);
        setCompanies(compList); setBatches(batchList);
      } catch (error) { setErrorMsg(formatSupabaseError(error, "Filter laporan belum dapat dimuat.")); }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true); setErrorMsg(null);
      const params = { p_company_id: companyId === "all" ? null : companyId, p_batch_id: batchId === "all" ? null : batchId };
      const [impact, monitoring] = await Promise.all([
        supabase.rpc("get_admin_group_impact", params),
        supabase.rpc("get_admin_monitoring", { ...params, p_limit: 1000, p_offset: 0 }),
      ]);
      if (!active) return;
      if (impact.error) {
        setErrorMsg(isAssessmentMigrationMissing(impact.error)
          ? "Methodology v1.0 belum tersedia di database. Terapkan migration 027 dan muat ulang schema PostgREST sebelum membuka Live Impact Report."
          : formatSupabaseError(impact.error, "Laporan impact belum dapat dimuat."));
      } else if (monitoring.error) {
        setErrorMsg(formatSupabaseError(monitoring.error, "Metrik operasional belum dapat dimuat."));
      } else {
        setReport(impact.data as GroupImpactReport);
        setOperations((monitoring.data ?? []).map((row: any) => ({
          userId: row.user_id, journeyStatus: row.journey_status ?? "NOT_ENROLLED", ptpStatus: row.ptp_status ?? "EDITABLE",
          daysInactive: row.days_inactive ?? 0, monthsReviewed: row.months_reviewed ?? 0, needsSupport: row.needs_support === true,
        })));
      }
      setLoading(false);
    }
    loadReport();
    return () => { active = false; };
  }, [batchId, companyId, supabase]);

  const availableBatches = batches.filter((batch) => companyId === "all" || batch.companyId === companyId);
  const summary = report ? summarizeGroupImpact(report) : null;
  const completed = operations.filter((row) => row.journeyStatus === "COMPLETED").length;
  const needSupport = operations.filter((row) => row.needsSupport || row.daysInactive > 5).length;
  const operationalActive = Math.max(0, operations.length - completed - needSupport);
  const reviewed = operations.filter((row) => row.monthsReviewed > 0).length;
  const locked = operations.filter((row) => row.ptpStatus === "LOCKED").length;
  const operationalPct = (value: number) => operations.length ? Math.round(value / operations.length * 100) : 0;
  const segments = [
    { label: "Selesai", count: completed, percentage: operationalPct(completed), color: "#10B981" },
    { label: "Aktif", count: operationalActive, percentage: operationalPct(operationalActive), color: "#F59E0B" },
    { label: "Perlu Dukungan", count: needSupport, percentage: operationalPct(needSupport), color: "#EF4444" },
  ];
  const selectedCompany = companies.find((company) => company.id === companyId);
  const score = (value: number | null) => value === null ? "Belum terukur" : `${value}%`;

  if (loading) return <div className="rounded-2xl border border-[#EAE5D9] bg-white p-12 text-center text-sm text-slate-500">Menghitung Methodology v1.0...</div>;
  if (errorMsg) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold leading-relaxed text-rose-800">{errorMsg}</div>;
  if (!summary || !report) return null;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#EAE5D9] bg-white p-4 print:hidden">
        <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Perusahaan</span><select value={companyId} onChange={(event) => { setCompanyId(event.target.value); setBatchId("all"); }} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"><option value="all">Semua Perusahaan</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="space-y-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Batch</span><select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"><option value="all">Semua Batch</option>{availableBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <span className="border-l border-slate-200 pl-4 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Live / Methodology {report.methodology_version}</span>
      </div>

      <section className="overflow-hidden rounded-3xl bg-[#0F1E3D] text-white">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1.9fr]">
          <div><span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-400">90-Day Impact Report</span><h2 className="mt-3 text-3xl font-black tracking-tight">{selectedCompany?.name || "Seluruh Ekosistem SLJ"}</h2><p className="mt-3 max-w-sm text-xs leading-relaxed text-blue-200">Skor hanya memakai peserta dengan bukti yang dapat dihitung. Coverage dan denominator ditampilkan agar data yang hilang tidak berubah menjadi performa nol.</p></div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {[
              ["Outcome", score(summary.outcome.score), `${summary.outcome.measured}/${summary.participantCount} peserta`],
              ["Execution", score(summary.execution.score), `${summary.execution.numerator}/${summary.execution.denominator} eksekusi`],
              ["Peer Support", score(summary.peerSupport.score), `${summary.peerSupport.numerator}/${summary.peerSupport.denominator} minggu`],
              ["Coach Assessment", score(summary.coachAssessment.score), `${summary.coachAssessment.measured}/${summary.coachAssessment.denominator} dinilai`],
              ["Validated Outcome", score(summary.validatedOutcome.score), `${summary.validatedOutcome.measured}/${summary.validatedOutcome.denominator} tervalidasi`],
              ["Peserta", summary.participantCount, "scope terpilih"],
            ].map(([label, value, detail]) => <div key={label} className="bg-[#142747] p-4"><span className="text-[9px] font-bold uppercase tracking-wider text-blue-200">{label}</span><p className="mt-1 text-xl font-black tabular-nums text-amber-400">{value}</p><p className="mt-1 text-[10px] text-blue-200">{detail}</p></div>)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EAE5D9] bg-white p-6">
        <div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 text-[#C79A3C]" /><div><h3 className="font-extrabold text-[#0F1E3D]">Engagement component coverage</h3><p className="mt-1 text-xs text-slate-500">Komponen dilaporkan terpisah. Tidak ada composite engagement headline.</p></div></div>
        <div className="mt-5 grid gap-px overflow-hidden rounded-xl bg-slate-200 sm:grid-cols-5">
          {Object.entries(summary.engagement).map(([key, component]) => <div key={key} className="bg-[#FAF8F4] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{key}</p><p className="mt-2 text-2xl font-black tabular-nums text-[#0F1E3D]">{component.coverage}%</p><p className="mt-1 text-[10px] text-slate-500">{component.numerator}/{component.denominator} peserta</p></div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[#EAE5D9] bg-[#FAF8F4] p-6">
        <div className="mb-5"><h3 className="font-extrabold text-[#0F1E3D]">Operational monitoring</h3><p className="mt-1 text-xs text-slate-500">Status administrasi dan intervensi, terpisah dari skor impact.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-5"><DonutChart segments={segments} totalCount={operations.length} totalLabel="Peserta" /></div>
          <div className="grid grid-cols-2 gap-3">{[
            { label: "Journey selesai", value: completed, icon: CheckCircle2 }, { label: "PTP terkunci", value: locked, icon: Lock },
            { label: "Checkpoint terisi", value: reviewed, icon: Activity }, { label: "Perlu dukungan", value: needSupport, icon: AlertTriangle },
          ].map((item) => <div key={item.label} className="rounded-xl bg-white p-4"><item.icon className="h-4 w-4 text-[#C79A3C]" /><p className="mt-4 text-2xl font-black tabular-nums text-[#0F1E3D]">{item.value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p></div>)}</div>
        </div>
      </section>

      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900"><Users className="h-4 w-4 shrink-0" /><p><strong>Interpretasi:</strong> Outcome memakai indikator PTP aktif dengan actual terbaru; Execution memasukkan jadwal tanpa log sebagai tidak selesai; Peer Support dihitung konsisten per minggu aktif. Nilai kosong tetap kosong, bukan nol.</p></div>
    </div>
  );
}
