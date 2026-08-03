"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Activity, AlertTriangle, Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchCompaniesFromSupabase, fetchBatchesFromSupabase, formatSupabaseError, Company, Batch } from "@/lib/company-store";
import { DonutChart } from "@/components/domain/DonutChart";

interface ReportRow {
  userId: string; fullName: string; companyId: string; batchId: string; habitAvg: number;
  daysInactive: number; monthsReviewed: number; needsSupport: boolean; journeyStatus: string; ptpStatus: string;
}

export function LiveImpactReport() {
  const supabase = createClient();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [companyId, setCompanyId] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const [monitoring, compList, batchList] = await Promise.all([
          supabase.rpc("get_admin_monitoring", { p_limit: 1000, p_offset: 0 }),
          fetchCompaniesFromSupabase(), fetchBatchesFromSupabase(),
        ]);
        if (monitoring.error) throw monitoring.error;
        setCompanies(compList); setBatches(batchList);
        setRows((monitoring.data || []).map((r: any) => ({
          userId: r.user_id, fullName: r.full_name, companyId: r.company_id || "", batchId: r.batch_id || "",
          habitAvg: r.habit_avg_percent ?? 0, daysInactive: r.days_inactive ?? 0, monthsReviewed: r.months_reviewed ?? 0,
          needsSupport: r.needs_support === true, journeyStatus: r.journey_status || "NOT_ENROLLED", ptpStatus: r.ptp_status || "EDITABLE",
        })));
      } catch (err: any) { setErrorMsg(formatSupabaseError(err, "Laporan belum dapat dimuat.")); }
      finally { setLoading(false); }
    }
    loadReport();
  }, [supabase]);

  const availableBatches = batches.filter((b) => companyId === "all" || b.companyId === companyId);
  const filtered = rows.filter((r) => (companyId === "all" || r.companyId === companyId) && (batchId === "all" || r.batchId === batchId));
  const completed = filtered.filter((r) => r.journeyStatus === "COMPLETED").length;
  const needSupport = filtered.filter((r) => r.needsSupport || r.daysInactive > 5).length;
  const active = Math.max(0, filtered.length - completed - needSupport);
  const avgHabit = filtered.length ? Math.round(filtered.reduce((a, r) => a + r.habitAvg, 0) / filtered.length) : 0;
  const reviewed = filtered.filter((r) => r.monthsReviewed > 0).length;
  const locked = filtered.filter((r) => r.ptpStatus === "LOCKED").length;
  const pct = (n: number) => filtered.length ? Math.round((n / filtered.length) * 100) : 0;
  const segments = [
    { label: "Selesai", count: completed, percentage: pct(completed), color: "#10B981" },
    { label: "Aktif", count: active, percentage: pct(active), color: "#F59E0B" },
    { label: "Perlu Dukungan", count: needSupport, percentage: pct(needSupport), color: "#EF4444" },
  ];
  const selectedCompany = companies.find((c) => c.id === companyId);

  if (loading) return <div className="rounded-2xl border border-[#EAE5D9] bg-white p-12 text-center text-sm text-slate-500">Memuat Live Report...</div>;
  if (errorMsg) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">{errorMsg}</div>;

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#EAE5D9] rounded-2xl p-4 flex flex-wrap items-end gap-4 print:hidden">
        <label className="space-y-1"><span className="block text-[10px] font-bold uppercase text-slate-500">Perusahaan</span><select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setBatchId("all"); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"><option value="all">Semua Perusahaan</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="space-y-1"><span className="block text-[10px] font-bold uppercase text-slate-500">Batch</span><select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"><option value="all">Semua Batch</option>{availableBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700">Live Data</span>
      </div>

      <section className="rounded-3xl bg-[#0F1E3D] p-6 sm:p-8 text-white">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">90-Day Program Operational Report</span>
        <h2 className="mt-2 text-2xl font-black">{selectedCompany?.name || "Seluruh Ekosistem SLJ"}</h2>
        <p className="mt-1 text-xs text-blue-200">{filtered.length} peserta pada scope terpilih</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["Peserta", filtered.length], ["Habit rata-rata", `${avgHabit}%`], ["Checkpoint terisi", `${reviewed}/${filtered.length}`], ["Perlu dukungan", needSupport]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-[10px] font-bold uppercase text-blue-200">{label}</span><p className="mt-1 text-2xl font-black text-amber-400">{value}</p></div>)}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-[#EAE5D9] bg-white p-6"><h3 className="font-extrabold text-[#0F1E3D]">Distribusi Status Peserta</h3><div className="mt-5"><DonutChart segments={segments} totalCount={filtered.length} totalLabel="Peserta" /></div></section>
        <section className="rounded-2xl border border-[#EAE5D9] bg-white p-6 space-y-4"><h3 className="font-extrabold text-[#0F1E3D]">Indikator Operasional</h3>{[
          { label: "Journey selesai", value: completed, icon: CheckCircle2, color: "text-emerald-700" },
          { label: "PTP terkunci", value: locked, icon: Lock, color: "text-purple-700" },
          { label: "Checkpoint pernah diisi", value: reviewed, icon: Activity, color: "text-blue-700" },
          { label: "Perlu dukungan", value: needSupport, icon: AlertTriangle, color: "text-amber-700" },
        ].map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"><span className={`flex items-center gap-2 text-xs font-bold ${item.color}`}><item.icon className="h-4 w-4" />{item.label}</span><strong className="text-lg text-[#0F1E3D]">{item.value}</strong></div>)}</section>
      </div>

      <section className="rounded-2xl border border-[#EAE5D9] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#EAE5D9]"><h3 className="font-extrabold text-[#0F1E3D] flex items-center gap-2"><Users className="h-4 w-4 text-[#C79A3C]" />Data Peserta Scope Terpilih</h3></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[44rem] text-left text-xs"><thead><tr className="bg-[#FAF8F4] text-slate-500"><th className="p-4">Peserta</th><th className="p-4">Habit</th><th className="p-4">Checkpoint</th><th className="p-4">Inaktivitas</th><th className="p-4">Journey</th><th className="p-4">PTP</th></tr></thead><tbody className="divide-y divide-[#EAE5D9]">{filtered.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">Belum ada data pada scope ini.</td></tr> : filtered.map((r) => <tr key={r.userId}><td className="p-4 font-bold text-[#0F1E3D]">{r.fullName}</td><td className="p-4">{r.habitAvg}%</td><td className="p-4">{r.monthsReviewed} bulan</td><td className="p-4">{r.daysInactive} hari</td><td className="p-4">{r.journeyStatus}</td><td className="p-4">{r.ptpStatus}</td></tr>)}</tbody></table></div>
      </section>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex gap-2"><Building2 className="h-4 w-4 shrink-0" /><p><strong>Live Report</strong> hanya menampilkan metrik yang tersedia dan dapat diverifikasi di database.</p></div>
    </div>
  );
}
