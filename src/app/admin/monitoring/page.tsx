"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Filter,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCompaniesFromSupabase,
  fetchBatchesFromSupabase,
  Company,
  Batch,
  formatSupabaseError,
} from "@/lib/company-store";
import { MonitoringRow, RawMonitoringRow, mapMonitoringRow } from "@/lib/admin-types";

const DAY_INACTIVE_THRESHOLD = 5;

export default function AdminMonitoringPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [participants, setParticipants] = useState<MonitoringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [rowsRes, compList, batchList] = await Promise.all([
        supabase.rpc("get_admin_monitoring", { p_limit: 1000, p_offset: 0 }),
        fetchCompaniesFromSupabase(),
        fetchBatchesFromSupabase(),
      ]);
      if (rowsRes.error) throw rowsRes.error;
      setCompanies(compList);
      setBatches(batchList);

        const mapped: MonitoringRow[] = (rowsRes.data || []).map((r: RawMonitoringRow) => mapMonitoringRow(r));
      setParticipants(mapped);
    } catch (err: any) {
      const errorText = formatSupabaseError(err, "Data monitoring belum dapat dimuat. Pastikan migration 018 berhasil dan akun memiliki role admin.");
      console.error("Error loading admin monitoring:", errorText, err);
      setErrorMsg(errorText);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [supabase]);

  const availableBatches = batches.filter(
    (b) => selectedCompanyId === "all" || b.companyId === selectedCompanyId
  );

  // Coach list diambil dari participant canonical supaya konsisten, bukan sintetis.
  const availableCoaches = Array.from(
    new Map(
      participants
        .filter(
          (p) =>
            p.coachId &&
            (selectedCompanyId === "all" || p.companyId === selectedCompanyId) &&
            (selectedBatchId === "all" || p.batchId === selectedBatchId)
        )
        .map((p) => [p.coachId, p.coachName || "Coach"])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  const filtered = participants.filter((p) => {
    const matchesComp = selectedCompanyId === "all" || p.companyId === selectedCompanyId;
    const matchesBatch = selectedBatchId === "all" || p.batchId === selectedBatchId;
    const matchesCoach = selectedCoachId === "all" || p.coachId === selectedCoachId;
    return matchesComp && matchesBatch && matchesCoach;
  });

  const avgHabit = filtered.length
    ? Math.round(filtered.reduce((acc, p) => acc + p.habitAvgPercent, 0) / filtered.length)
    : 0;
  const needSupportCount = filtered.filter(
    (p) => p.needsSupport || p.daysInactive > DAY_INACTIVE_THRESHOLD
  ).length;
  const lockedCount = filtered.filter((p) => p.ptpStatus === "LOCKED").length;

  const selectedCompanyName =
    selectedCompanyId === "all"
      ? "Semua Perusahaan"
      : companies.find((c) => c.id === selectedCompanyId)?.name || "—";
  const selectedBatchName =
    selectedBatchId === "all" ? "Semua Batch" : batches.find((b) => b.id === selectedBatchId)?.name || "—";
  const selectedCoachName =
    selectedCoachId === "all"
      ? "Semua Coach"
      : availableCoaches.find((c) => c.id === selectedCoachId)?.name || "—";

  return (
    <div className="space-y-8">
      <div className="border-b border-[#EAE5D9] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-[#C79A3C]" /> Drill-down Program Monitoring
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Filter hierarki lengkap: Company → Batch → Coach → Participant (sumber: canonical view).
          </p>
        </div>
        <button
          onClick={() => loadAllData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EAE5D9] text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#C79A3C] ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Summary Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Peserta", value: filtered.length },
          { label: "Progres Habit Rata-rata", value: `${avgHabit}%` },
          { label: "Perlu Dukungan", value: needSupportCount, accent: "text-amber-700 bg-amber-50" },
          { label: "PTP Terlocked", value: lockedCount, accent: "text-purple-700 bg-purple-50" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border border-[#EAE5D9] p-4 bg-white ${s.accent || ""}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-[#071A33]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Drill-down Controls */}
      <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
          <Filter className="h-4 w-4 text-[#C79A3C]" />
          <span>Filter Hierarki Drill-Down</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">1. Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setSelectedBatchId("all");
                setSelectedCoachId("all");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Perusahaan</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.participantCount} peserta)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">2. Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedCoachId("all");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Batch ({availableBatches.length})</option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.accessCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">3. Coach</label>
            <select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]">
              <option value="all">Semua Coach ({availableCoaches.length})</option>
              {availableCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto">
          <span className="font-bold text-[#0B2C6B]">Filter Aktif:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedCompanyName}</span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedBatchName}</span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{selectedCoachName}</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs space-y-0">
        <div className="flex items-center justify-between border-b border-[#EAE5D9] p-4 sm:p-6 sm:pb-4">
          <h2 className="text-base font-extrabold text-[#071A33]">
            Hasil Drill-Down ({filtered.length} Peserta)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE5D9] text-slate-400 font-bold bg-[#FAF8F4]">
                <th className="p-4 font-semibold">Peserta</th>
                <th className="p-4 font-semibold">Perusahaan</th>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Coach</th>
                <th className="p-4 font-semibold">Progres Habit</th>
                <th className="p-4 font-semibold">Inaktivitas</th>
                <th className="p-4 font-semibold">Checkpoint</th>
                <th className="p-4 font-semibold">PTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Memuat canonical view...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    {errorMsg ? errorMsg : "Tidak ada peserta pada filter ini."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.userId} className="hover:bg-[#FAF8F4]/80">
                    <td className="p-4 font-extrabold text-[#071A33]">
                      {p.fullName}
                      <span className="block text-[10px] font-medium text-slate-400">
                        Status: {p.journeyStatus}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{p.companyName || "—"}</td>
                    <td className="p-4 font-medium text-slate-600">{p.batchName || "—"}</td>
                    <td className="p-4 font-medium text-slate-600">{p.coachName || "—"}</td>
                    <td className="p-4 font-bold text-emerald-700">{p.habitAvgPercent}%</td>
                    <td className="p-4 font-medium text-slate-600">{p.daysInactive} hari</td>
                    <td className="p-4 font-medium text-slate-600">{p.monthsReviewed} bulan</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.needsSupport ? "bg-amber-50 text-amber-700" : p.ptpStatus === "LOCKED" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {p.needsSupport ? "NEED SUPPORT" : p.ptpStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
