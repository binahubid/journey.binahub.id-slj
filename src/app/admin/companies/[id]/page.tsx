"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Layers,
  UserCheck,
  Activity,
  ArrowLeft,
  Key,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Power,
  PowerOff,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/company-store";
import { MonitoringRow, RawMonitoringRow, mapMonitoringRow, ReferentialStatus } from "@/lib/admin-types";

interface CompanyData {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
}

interface BatchData {
  id: string;
  companyId: string;
  name: string;
  accessCode: string;
  status: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  coachId: string;
  coachName: string;
}

interface CoachData {
  id: string;
  name: string;
  email: string;
  participantCount: number;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [participants, setParticipants] = useState<MonitoringRow[]>([]);
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "coaches" | "participants" | "analytics">("overview");

  // Edit company state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Deactivate/reactivate state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [referentialStatus, setReferentialStatus] = useState<ReferentialStatus | null>(null);
  const [loadingRefStatus, setLoadingRefStatus] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);

  useEffect(() => {
    if (!companyId) {
      notFound();
      return;
    }

    async function loadCompanyData() {
      setLoading(true);
      setErrorMsg(null);

      const supabase = createClient();

      try {
        const { data: companyRow, error: companyErr } = await supabase
          .from("companies")
          .select("id, name, code, status, created_at")
          .eq("id", companyId)
          .single();

        if (companyErr || !companyRow) {
          notFound();
          return;
        }

        setCompany({
          id: companyRow.id,
          name: companyRow.name,
          code: companyRow.code,
          status: companyRow.status || "Active",
          createdAt: companyRow.created_at ? companyRow.created_at.split("T")[0] : "",
        });

        const [batchesRes, monitoringRes] = await Promise.all([
          supabase
            .from("batches")
            .select("id, company_id, name, access_code, status, start_date, end_date, coach_id, coach_name")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
          supabase.rpc("get_admin_monitoring", {
            p_company_id: companyId,
            p_limit: 1000,
            p_offset: 0,
          }),
        ]);

        if (batchesRes.error) throw batchesRes.error;

        const batchRows = batchesRes.data || [];
        setBatches(
          batchRows.map((b: any) => ({
            id: b.id,
            companyId: b.company_id || "",
            name: b.name,
            accessCode: b.access_code,
            status: b.status || "Active",
            startDate: b.start_date || "",
            endDate: b.end_date || "",
            participantCount: 0,
            coachId: b.coach_id || "",
            coachName: b.coach_name || "Coach Pendamping",
          }))
        );

        if (monitoringRes.error) throw monitoringRes.error;

        const monitorRows: MonitoringRow[] = (monitoringRes.data || []).map((r: RawMonitoringRow) => mapMonitoringRow(r));

        setParticipants(monitorRows);

        const batchParticipantCounts = new Map<string, number>();
        monitorRows.forEach((p) => {
          if (p.batchId) {
            batchParticipantCounts.set(p.batchId, (batchParticipantCounts.get(p.batchId) || 0) + 1);
          }
        });

        setBatches((prev) =>
          prev.map((b) => ({
            ...b,
            participantCount: batchParticipantCounts.get(b.id) || 0,
          }))
        );

        const coachMap = new Map<string, CoachData>();
        monitorRows.forEach((p) => {
          if (p.coachId) {
            if (!coachMap.has(p.coachId)) {
              coachMap.set(p.coachId, {
                id: p.coachId,
                name: p.coachName || "Coach",
                email: "",
                participantCount: 0,
              });
            }
            coachMap.get(p.coachId)!.participantCount++;
          }
        });

        if (coachMap.size > 0) {
          const coachIds = Array.from(coachMap.keys());
          const { data: coachProfiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", coachIds);

          (coachProfiles || []).forEach((cp: any) => {
            const existing = coachMap.get(cp.user_id);
            if (existing) {
              existing.name = cp.full_name || existing.name;
              existing.email = cp.email || "";
            }
          });
        }

        setCoaches(Array.from(coachMap.values()));
      } catch (err: any) {
        console.error("Error loading company detail:", err);
        setErrorMsg(formatSupabaseError(err, "Gagal memuat data perusahaan."));
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [companyId]);

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingEdit(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("update_company", {
        p_company_id: companyId,
        p_name: editName.trim(),
      });
      if (error) throw error;

      setCompany((prev) => prev ? { ...prev, name: editName.trim() } : prev);
      setShowEditModal(false);
      setSuccessMsg("Nama perusahaan berhasil diperbarui.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err, "Gagal memperbarui data perusahaan."));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeactivate = async () => {
    setExecutingAction(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("deactivate_company", {
        p_company_id: companyId,
      });
      if (error) throw error;

      setCompany((prev) => prev ? { ...prev, status: "Inactive" } : prev);
      setShowDeactivateModal(false);
      setSuccessMsg("Perusahaan berhasil dinonaktifkan.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err, "Gagal menonaktifkan perusahaan."));
    } finally {
      setExecutingAction(false);
    }
  };

  const handleReactivate = async () => {
    setExecutingAction(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("reactivate_company", {
        p_company_id: companyId,
      });
      if (error) throw error;

      setCompany((prev) => prev ? { ...prev, status: "Active" } : prev);
      setShowReactivateModal(false);
      setSuccessMsg("Perusahaan berhasil diaktifkan kembali.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err, "Gagal mengaktifkan perusahaan."));
    } finally {
      setExecutingAction(false);
    }
  };

  const loadReferentialStatus = async () => {
    setLoadingRefStatus(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_company_referential_status", {
        p_company_id: companyId,
      });
      if (error) throw error;
      setReferentialStatus(data);
    } catch (err) {
      console.error("Error loading referential status:", err);
      setErrorMsg(formatSupabaseError(err, "Gagal memeriksa status referensi perusahaan."));
    } finally {
      setLoadingRefStatus(false);
    }
  };

  const openDeactivateModal = async () => {
    setShowDeactivateModal(true);
    await loadReferentialStatus();
  };

  const openEditModal = () => {
    setEditName(company?.name || "");
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">Memuat data perusahaan...</div>
    );
  }

  if (!company) {
    notFound();
    return null;
  }

  const totalParticipants = participants.length;
  const avgHabit = totalParticipants > 0
    ? Math.round(participants.reduce((acc, p) => acc + p.habitAvgPercent, 0) / totalParticipants)
    : 0;
  const needSupportCount = participants.filter((p) => p.needsSupport).length;
  const lockedCount = participants.filter((p) => p.ptpStatus === "LOCKED").length;

  const healthScore = totalParticipants === 0
    ? 100
    : Math.min(100, Math.round(avgHabit * 0.6 + (100 - Math.min(needSupportCount / totalParticipants * 100, 100)) * 0.4));

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "batches" as const, label: `Batch (${batches.length})` },
    { id: "coaches" as const, label: `Coach (${coaches.length})` },
    { id: "participants" as const, label: `Participant (${totalParticipants})` },
    { id: "analytics" as const, label: "Analytics" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="space-y-4">
        <Link href="/admin/companies" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#071A33]">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Company
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#0B2C6B] flex items-center justify-center text-[#C79A3C] font-extrabold text-xl shadow-md">
              {company.code.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">{company.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                  {company.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Kode Akses Perusahaan: <span className="font-mono font-bold text-[#C79A3C]">{company.code}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EAE5D9] bg-white hover:bg-[#FAF8F4] text-[#071A33] text-xs font-bold transition-all"
            >
              <Pencil className="h-4 w-4 text-[#C79A3C]" /> Edit
            </button>
            {company.status === "Active" ? (
              <button
                onClick={openDeactivateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all"
              >
                <PowerOff className="h-4 w-4" /> Nonaktifkan
              </button>
            ) : (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all"
              >
                <Power className="h-4 w-4" /> Aktifkan
              </button>
            )}
            <Link href="/admin/batches">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md">
                <Key className="h-4 w-4 text-[#C79A3C]" /> Buat Batch Baru
              </button>
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Total Peserta</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{totalParticipants}</h3>
          <p className="text-[11px] text-slate-500 font-medium">Terdaftar & Aktif</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Total Batch</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{batches.length}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">
            {batches.filter((b) => b.status === "Active").length} Active
            {batches.filter((b) => b.status === "Upcoming").length > 0 && ` \u00b7 ${batches.filter((b) => b.status === "Upcoming").length} Upcoming`}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Dedicated Coach</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{coaches.length}</h3>
          <p className="text-[11px] text-slate-500 font-medium">Coach Bimbingan</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Health Score</span>
          <h3 className={`text-3xl font-extrabold ${healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-rose-600"}`}>
            {healthScore}
          </h3>
          <p className={`text-[11px] font-semibold ${healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-rose-600"}`}>
            {healthScore >= 80 ? "Kondisi Sangat Sehat" : healthScore >= 50 ? "Perlu Perhatian" : "Kritis"}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#EAE5D9] flex items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-[#0B2C6B] text-[#0B2C6B]"
                : "border-transparent text-slate-500 hover:text-[#071A33]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C79A3C]" /> Ringkasan Batch {company.name}
            </h2>
            <div className="space-y-3">
              {batches.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium py-4 text-center">Belum ada batch untuk perusahaan ini.</p>
              ) : (
                batches.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4]/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#071A33] text-sm">{b.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Coach: {b.coachName} \u2022 Code: <span className="font-mono text-[#0B2C6B] font-bold">{b.accessCode}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#071A33] block">{b.participantCount} Peserta</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : b.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#071A33]">Ringkasan Kesehatan</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#EAE5D9]">
                <span className="text-slate-500">Rata-rata Habit Log</span>
                <span className="font-bold text-[#071A33]">{avgHabit}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#EAE5D9]">
                <span className="text-slate-500">Checkpoint Terisi</span>
                <span className="font-bold text-[#071A33]">{participants.filter((p) => p.monthsReviewed > 0).length}/{totalParticipants}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Peserta Perlu Dukungan</span>
                <span className="font-bold text-amber-600">{needSupportCount} Peserta</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Batches */}
      {activeTab === "batches" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Daftar Batch {company.name}</h2>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-8 text-center">Belum ada batch. Buat batch baru dari halaman Batches.</p>
          ) : (
            <div className="divide-y divide-[#EAE5D9]">
              {batches.map((b) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#071A33] text-sm">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Periode: {b.startDate || "\u2014"} s/d {b.endDate || "\u2014"}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#071A33] block">{b.participantCount} Peserta</span>
                      <span className="text-[11px] font-mono text-[#C79A3C] font-bold">{b.accessCode}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      b.status === "Active" ? "bg-[#0B2C6B] text-white" : b.status === "Upcoming" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Coaches */}
      {activeTab === "coaches" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Coach Pendamping Dedicated</h2>
          {coaches.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-8 text-center">Belum ada coach yang ditugaskan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coaches.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#071A33] text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.email || "\u2014"}</p>
                  </div>
                  <span className="text-xs font-bold text-[#0B2C6B] bg-white px-3 py-1 rounded-lg border border-[#EAE5D9]">
                    {c.participantCount} Peserta
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Participants */}
      {activeTab === "participants" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Daftar Peserta Corporate</h2>
          {participants.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-8 text-center">Belum ada peserta di perusahaan ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE5D9] text-slate-400 font-bold">
                    <th className="pb-3">Nama Peserta</th>
                    <th className="pb-3">Batch</th>
                    <th className="pb-3">Coach</th>
                    <th className="pb-3">Progres Habit</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5D9]">
                  {participants.map((p) => (
                    <tr key={p.userId} className="hover:bg-[#FAF8F4]">
                      <td className="py-3 font-bold text-[#071A33]">
                        {p.fullName}
                        <br />
                        <span className="text-slate-400 font-normal">{p.journeyStatus}</span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{p.batchName || "\u2014"}</td>
                      <td className="py-3 text-slate-600 font-medium">{p.coachName || "\u2014"}</td>
                      <td className="py-3 font-bold text-emerald-600">{p.habitAvgPercent}%</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.needsSupport
                            ? "bg-amber-50 text-amber-700"
                            : p.ptpStatus === "LOCKED"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {p.needsSupport ? "NEED SUPPORT" : p.ptpStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Analytics */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Rata-rata Habit Completion</span>
            <div className="text-3xl font-extrabold text-[#071A33]">{avgHabit}%</div>
            <p className="text-xs text-slate-500 font-semibold">
              {totalParticipants > 0 ? `${totalParticipants} peserta aktif` : "Tidak ada data"}
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Checkpoint Terisi</span>
            <div className="text-3xl font-extrabold text-[#071A33]">
              {totalParticipants > 0 ? `${participants.filter((p) => p.monthsReviewed > 0).length}/${totalParticipants}` : "0/0"}
            </div>
            <p className="text-xs text-slate-500 font-semibold">Bulan review terisi</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Need Support Rate</span>
            <div className="text-3xl font-extrabold text-amber-600">{needSupportCount} Peserta</div>
            <p className="text-xs text-amber-600 font-semibold">
              {totalParticipants > 0 ? `${Math.round(needSupportCount / totalParticipants * 100)}% dari total` : "Tidak ada data"}
            </p>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#071A33]">Edit Nama Perusahaan</h3>
              <p className="text-xs text-slate-500 font-medium">
                Ubah nama perusahaan. Kode akses tidak dapat diubah.
              </p>
            </div>

            <form onSubmit={handleEditCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold shadow-md"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Company Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 text-rose-900">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <PowerOff className="h-5 w-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#071A33]">Nonaktifkan Perusahaan</h3>
                <p className="text-xs text-rose-800 font-medium">{company?.name}</p>
              </div>
            </div>

            {loadingRefStatus ? (
              <div className="text-xs text-slate-500 font-medium py-4 text-center">Memeriksa data referensi...</div>
            ) : referentialStatus ? (
              <div className="bg-rose-50/80 border border-rose-200/80 p-3.5 rounded-xl space-y-2 text-xs text-rose-950 leading-relaxed">
                <p className="font-semibold">Status Referensi:</p>
                <ul className="space-y-1 text-[11px]">
                  <li>Batch aktif: <span className="font-bold">{referentialStatus.active_batch_count}</span> dari {referentialStatus.batch_count} total</li>
                  <li>Peserta aktif: <span className="font-bold">{referentialStatus.active_participant_count}</span> dari {referentialStatus.participant_count} total</li>
                </ul>
                {!referentialStatus.can_deactivate && (
                  <p className="text-rose-700 font-semibold pt-1">
                    Tidak dapat menonaktifkan: masih ada batch aktif atau peserta aktif.
                  </p>
                )}
              </div>
            ) : null}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={executingAction}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={executingAction || (referentialStatus && !referentialStatus.can_deactivate) || false}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {executingAction ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Company Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowReactivateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 text-emerald-900">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Power className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#071A33]">Aktifkan Kembali Perusahaan</h3>
                <p className="text-xs text-emerald-800 font-medium">{company?.name}</p>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-xl text-xs text-emerald-950 leading-relaxed">
              <p className="font-semibold">Aktifkan kembali perusahaan ini?</p>
              <p className="text-[11px] text-emerald-900/80 mt-1">Perusahaan akan muncul kembali di daftar dan dapat menerima batch baru.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReactivateModal(false)}
                disabled={executingAction}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReactivate}
                disabled={executingAction}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5"
              >
                {executingAction ? "Memproses..." : "Ya, Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
