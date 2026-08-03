"use client";

import { useEffect, useState } from "react";
import { Users, Search, Building2, Layers, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCompaniesFromSupabase,
  fetchBatchesFromSupabase,
  Company,
  Batch,
  formatSupabaseError,
} from "@/lib/company-store";
import { MonitoringRow, RawMonitoringRow, mapMonitoringRow } from "@/lib/admin-types";

export interface ParticipantReal {
  userId: string;
  displayId: string;
  name: string;
  companyId: string;
  companyName: string;
  batchId: string;
  batchName: string;
  coachName: string;
  journeyStatus: string;
  ptpStatus: string;
  habitAvgPercent: number;
  daysInactive: number;
  monthsReviewed: number;
  needsSupport: boolean;
  status: "NOT_ENROLLED" | "ONBOARDING" | "ACTIVE" | "COMPLETED" | "NEED_SUPPORT";
}

const DAY_INACTIVE_THRESHOLD = 5;

export default function ParticipantsPage() {
  const supabase = createClient();
  const [participants, setParticipants] = useState<ParticipantReal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadDataFromSupabase() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [rows, compList, batchList] = await Promise.all([
        supabase.rpc("get_admin_monitoring", { p_limit: 1000, p_offset: 0 }),
        fetchCompaniesFromSupabase(),
        fetchBatchesFromSupabase(),
      ]);
      if (rows.error) throw rows.error;
      setCompanies(compList);
      setBatches(batchList);

      const mapped: ParticipantReal[] = (rows.data || []).map((r: RawMonitoringRow) => {
        const row = mapMonitoringRow(r);
        const needsSupport = row.needsSupport || row.daysInactive > DAY_INACTIVE_THRESHOLD;
        let status: ParticipantReal["status"] = "ACTIVE";
        if (row.journeyStatus === "ONBOARDING" || row.journeyStatus === "NOT_ENROLLED") status = "ONBOARDING";
        else if (row.journeyStatus === "COMPLETED") status = "COMPLETED";
        else if (needsSupport) status = "NEED_SUPPORT";
        return {
          userId: row.userId,
          displayId: "-",
          name: row.fullName,
          companyId: row.companyId,
          companyName: row.companyName,
          batchId: row.batchId,
          batchName: row.batchName,
          coachName: row.coachName,
          journeyStatus: row.journeyStatus,
          ptpStatus: row.ptpStatus,
          habitAvgPercent: row.habitAvgPercent,
          daysInactive: row.daysInactive,
          monthsReviewed: row.monthsReviewed,
          needsSupport,
          status,
        };
      });

      setParticipants(mapped);

      // Fetch display_ids separately
      const userIds = mapped.map((p) => p.userId);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_id")
          .in("user_id", userIds);
        if (profiles) {
          const idMap = new Map(profiles.map((p: any) => [p.user_id, p.display_id]));
          setParticipants((prev) =>
            prev.map((p) => ({ ...p, displayId: idMap.get(p.userId) || "-" }))
          );
        }
      }
    } catch (err: any) {
      const errorText = formatSupabaseError(err, "Data peserta belum dapat dimuat. Pastikan migration 018 berhasil dan akun memiliki role admin.");
      console.error("Gagal load peserta:", errorText, err);
      setErrorMsg(errorText);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const filtered = participants.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      p.batchName.toLowerCase().includes(q) ||
      p.displayId.includes(q);
    const matchesCompany = selectedCompanyFilter === "all" || p.companyId === selectedCompanyFilter;
    const matchesBatch = selectedBatchFilter === "all" || p.batchId === selectedBatchFilter;
    return matchesSearch && matchesCompany && matchesBatch;
  });

  const filteredBatches = batches.filter(
    (b) => selectedCompanyFilter === "all" || b.companyId === selectedCompanyFilter
  );

  const statusLabel: Record<ParticipantReal["status"], string> = {
    ACTIVE: "Aktif",
    NEED_SUPPORT: "Perlu Bimbingan",
    NOT_ENROLLED: "Belum Terdaftar Batch",
    ONBOARDING: "Onboarding",
    COMPLETED: "Selesai",
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-[#C79A3C]" /> Participants (Daftar Peserta)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Data canonical dari view admin monitoring — journey aktif, habit, checkpoint, dan inactivity.
          </p>
        </div>
        <button
          onClick={loadDataFromSupabase}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EAE5D9] text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs self-start disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#C79A3C] ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, ID, perusahaan, atau batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => {
              setSelectedCompanyFilter(e.target.value);
              setSelectedBatchFilter("all");
            }}
            className="px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          >
            <option value="all">Semua Perusahaan</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          >
            <option value="all">Semua Batch</option>
            {filteredBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs">
        <div className="flex flex-col items-start gap-2 border-b border-[#EAE5D9] bg-[#FAF8F4]/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-extrabold text-[#071A33]">
            Menampilkan {filtered.length} dari {participants.length} Peserta Terdaftar
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {loading ? "Memuat…" : errorMsg ? "Gagal memuat" : "Sumber: Canonical View"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9] text-slate-400 font-bold">
                <th className="p-4 font-semibold">Nama Peserta</th>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Coach</th>
                <th className="p-4 font-semibold">Progres Habit</th>
                <th className="p-4 font-semibold">Checkpoint</th>
                <th className="p-4 font-semibold">Inaktivitas</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    <div className="animate-spin h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Memuat data peserta dari canonical view...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    {errorMsg ? errorMsg : "Tidak ada peserta yang cocok dengan filter saat ini."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.userId} className="hover:bg-[#FAF8F4]/80 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-[#071A33]">{p.name}</div>
                      <div className="text-slate-400 text-[11px] font-normal">
                        PTP: {p.ptpStatus === "LOCKED" ? "Terlocked" : "Editable"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#C79A3C] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        {p.displayId}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#C79A3C]" />
                        <span>{p.companyName || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{p.batchName || "—"}</td>
                    <td className="p-4 font-medium text-slate-600">{p.coachName || "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.habitAvgPercent >= 80
                                ? "bg-emerald-500"
                                : p.habitAvgPercent >= 50
                                ? "bg-amber-500"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${p.habitAvgPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{p.habitAvgPercent}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {p.monthsReviewed} bulan
                      {p.needsSupport && <span className="block text-[10px] font-bold text-amber-700">Perlu dukungan</span>}
                    </td>
                    <td className="p-4 font-medium text-slate-600">{p.daysInactive} hari</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "NEED_SUPPORT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : p.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {statusLabel[p.status]}
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
