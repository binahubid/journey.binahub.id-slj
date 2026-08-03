"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Layers,
  Users,
  UserCheck,
  Activity,
  ArrowRight,
  Plus,
  ShieldCheck,
  Key,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCompaniesFromSupabase,
  fetchBatchesFromSupabase,
  formatSupabaseError,
  Company,
  Batch,
} from "@/lib/company-store";
import { RawMonitoringRow } from "@/lib/admin-types";

interface MonitoringSummary {
  totalParticipants: number;
  avgHabitPercent: number;
  needSupportCount: number;
  coachCount: number;
}

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringSummary>({
    totalParticipants: 0,
    avgHabitPercent: 0,
    needSupportCount: 0,
    coachCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const supabase = createClient();
        const [compList, batchList, monitoringRes] = await Promise.all([
          fetchCompaniesFromSupabase(),
          fetchBatchesFromSupabase(),
          supabase.rpc("get_admin_monitoring", { p_limit: 1000, p_offset: 0 }),
        ]);

        setCompanies(compList);
        setBatches(batchList);

        if (monitoringRes.error) throw monitoringRes.error;

        const rows: RawMonitoringRow[] = monitoringRes.data || [];
        const totalParticipants = rows.length;
        const avgHabitPercent = totalParticipants > 0
          ? Math.round(rows.reduce((acc, r) => acc + (r.habit_avg_percent ?? 0), 0) / totalParticipants)
          : 0;
        const needSupportCount = rows.filter(
          (r) => r.needs_support === true || (r.days_inactive ?? 0) > 5
        ).length;

        const coachIds = new Set(rows.map((r) => r.coach_id).filter(Boolean));

        setMonitoring({
          totalParticipants,
          avgHabitPercent,
          needSupportCount,
          coachCount: coachIds.size,
        });
      } catch (err: any) {
        console.error("Error loading admin dashboard:", err);
        setErrorMsg(formatSupabaseError(err, "Gagal memuat data dashboard."));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeBatchesCount = batches.filter((b) => b.status === "Active").length;

  const healthScore = monitoring.totalParticipants === 0
    ? 100
    : Math.min(100, Math.round(
        monitoring.avgHabitPercent * 0.6 +
        (100 - Math.min(monitoring.needSupportCount / monitoring.totalParticipants * 100, 100)) * 0.4
      ));

  return (
    <div className="space-y-8">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
            Admin Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manajemen hierarki ekosistem: Company &rarr; Batch &rarr; Coach &rarr; Participant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/batches">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md">
              <Key className="h-4 w-4 text-[#C79A3C]" /> Generate Access Code
            </button>
          </Link>
          <Link href="/admin/companies">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0B2C6B]/20 bg-white hover:bg-[#FAF8F4] text-[#071A33] text-xs font-bold transition-all">
              <Plus className="h-4 w-4 text-[#C79A3C]" /> Tambah Company
            </button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Companies */}
        <Link href="/admin/companies" className="block group">
          <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs group-hover:border-[#C79A3C] transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Companies</span>
              <div className="h-8 w-8 rounded-lg bg-[#0B2C6B]/10 flex items-center justify-center text-[#0B2C6B]">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#071A33]">{companies.length}</div>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              {companies.length > 0 ? `${companies.length} Active Companies` : 'Belum Ada Perusahaan'}
            </p>
          </div>
        </Link>

        {/* Card 2: Active Batches */}
        <Link href="/admin/batches" className="block group">
          <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs group-hover:border-[#C79A3C] transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Active Batches</span>
              <div className="h-8 w-8 rounded-lg bg-[#C79A3C]/10 flex items-center justify-center text-[#C79A3C]">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#071A33]">{activeBatchesCount}</div>
            <p className="text-[11px] font-semibold text-emerald-600">Tersebar di {companies.length} Perusahaan</p>
          </div>
        </Link>

        {/* Card 3: Participants */}
        <Link href="/admin/participants" className="block group">
          <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs group-hover:border-[#C79A3C] transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Participants</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#071A33]">{monitoring.totalParticipants}</div>
            <p className="text-[11px] font-semibold text-slate-500">Peserta Terdaftar</p>
          </div>
        </Link>

        {/* Card 4: Coaches */}
        <Link href="/admin/coaches" className="block group">
          <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs group-hover:border-[#C79A3C] transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Coaches</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#071A33]">{monitoring.coachCount}</div>
            <p className="text-[11px] font-semibold text-slate-500">Coach Bimbingan</p>
          </div>
        </Link>

        {/* Card 5: Program Health */}
        <Link href="/admin/monitoring" className="block group min-[375px]:col-span-2 lg:col-span-1">
          <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs group-hover:border-[#C79A3C] transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Program Health</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#C79A3C]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-3xl font-extrabold ${healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-rose-600"}`}>
              {healthScore}
            </div>
            <p className={`text-[11px] font-semibold ${healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-rose-600"}`}>
              Health Score Ekosistem
            </p>
          </div>
        </Link>
      </div>

      {/* Grid Overview: Recent Companies & Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Companies Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE5D9] p-4 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col items-start gap-3 border-b border-[#EAE5D9] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#C79A3C]" /> Perusahaan Terdaftar (Company)
              </h2>
              <p className="text-xs text-slate-500 font-medium">Monitoring per entitas perusahaan</p>
            </div>
            <Link href="/admin/companies" className="text-xs font-bold text-[#0B2C6B] hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="h-3.5 w-3.5 text-[#C79A3C]" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">Memuat data...</div>
            ) : companies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium space-y-2">
                <p>Belum ada perusahaan mitra terdaftar di Supabase.</p>
                <Link href="/admin/companies" className="inline-block font-bold text-[#0B2C6B] underline">
                  + Tambah Perusahaan Baru
                </Link>
              </div>
            ) : (
              <table className="w-full min-w-[48rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE5D9] text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">Nama Perusahaan</th>
                    <th className="pb-3 font-semibold">Peserta</th>
                    <th className="pb-3 font-semibold">Batch</th>
                    <th className="pb-3 font-semibold">Coach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5D9]">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF8F4]/80 transition-colors">
                      <td className="py-3.5">
                        <Link href={`/admin/companies/${c.id}`} className="font-bold text-[#071A33] hover:text-[#0B2C6B]">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-600">{c.participantCount} Peserta</td>
                      <td className="py-3.5 font-semibold text-slate-600">{c.batchCount} Batch</td>
                      <td className="py-3.5 font-semibold text-slate-600">{c.coachCount} Coach</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Active Batches & Access Codes */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE5D9] p-4 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col items-start gap-3 border-b border-[#EAE5D9] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#C79A3C]" /> Batch & Access Code
              </h2>
              <p className="text-xs text-slate-500 font-medium">Kode akses pendaftaran otomatis</p>
            </div>
            <Link href="/admin/batches" className="text-xs font-bold text-[#0B2C6B] hover:underline flex items-center gap-1">
              Kelola Batch <ArrowRight className="h-3.5 w-3.5 text-[#C79A3C]" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">Memuat data...</div>
            ) : batches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium space-y-2">
                <p>Belum ada batch rombongan yang dibuat.</p>
                <Link href="/admin/batches" className="inline-block font-bold text-[#0B2C6B] underline">
                  + Generate Batch & Access Code
                </Link>
              </div>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#071A33] text-sm">{b.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      b.status === "Active" ? "bg-[#0B2C6B] text-white" : b.status === "Upcoming" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{b.companyName}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#EAE5D9]/60 text-xs">
                    <span className="font-bold text-slate-500">Access Code:</span>
                    <span className="font-mono font-extrabold text-[#0B2C6B] bg-white px-2.5 py-1 rounded border border-[#0B2C6B]/20 select-all">
                      {b.accessCode}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
