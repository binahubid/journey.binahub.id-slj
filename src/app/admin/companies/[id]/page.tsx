"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import {
  getStoredCompanies,
  getStoredBatches,
  INITIAL_COACHES,
  INITIAL_PARTICIPANTS,
  Company,
  Batch,
} from "@/lib/company-store";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "coaches" | "participants" | "analytics">("overview");

  useEffect(() => {
    const allCompanies = getStoredCompanies();
    const found = allCompanies.find((c) => c.id === companyId) || allCompanies[0];
    setCompany(found);

    const allBatches = getStoredBatches();
    const companyBatches = allBatches.filter((b) => b.companyId === companyId || found.name.includes(b.companyName));
    setBatches(companyBatches.length > 0 ? companyBatches : allBatches.slice(0, 2));
  }, [companyId]);

  if (!company) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">Memuat data perusahaan...</div>
    );
  }

  const companyParticipants = INITIAL_PARTICIPANTS.filter((p) => p.companyId === company.id || p.companyName === company.name);
  const companyCoaches = INITIAL_COACHES.filter((c) => c.assignedCompanies.includes(company.name));

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

          <Link href="/admin/batches">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md">
              <Key className="h-4 w-4 text-[#C79A3C]" /> Buat Batch Baru
            </button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards (4 Top Metrics as specified) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Total Peserta</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{company.participantCount}</h3>
          <p className="text-[11px] text-slate-500 font-medium">Terdaftar & Aktif</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Total Batch</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{company.batchCount}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">1 Active • 1 Upcoming</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Dedicated Coach</span>
          <h3 className="text-3xl font-extrabold text-[#071A33]">{company.coachCount}</h3>
          <p className="text-[11px] text-slate-500 font-medium">Coach Bimbingan</p>
        </div>

        <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-1 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold">Health Score</span>
          <h3 className="text-3xl font-extrabold text-emerald-600">{company.healthScore}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">Kondisi Sangat Sehat</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#EAE5D9] flex items-center gap-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "batches", label: `Batch (${batches.length})` },
          { id: "coaches", label: `Coach (${companyCoaches.length || company.coachCount})` },
          { id: "participants", label: `Participant (${companyParticipants.length || company.participantCount})` },
          { id: "analytics", label: "Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
              {batches.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4]/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#071A33] text-sm">{b.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Coach: {b.coachName} • Code: <span className="font-mono text-[#0B2C6B] font-bold">{b.accessCode}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-[#071A33] block">{b.participantCount} Peserta</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#071A33]">Ringkasan Kesehatan</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#EAE5D9]">
                <span className="text-slate-500">Rata-rata Habit Log</span>
                <span className="font-bold text-[#071A33]">{company.habitCompletionPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#EAE5D9]">
                <span className="text-slate-500">Penyelesaian Checkpoint</span>
                <span className="font-bold text-[#071A33]">{company.checkpointCompletionPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Peserta Perlu Dukungan</span>
                <span className="font-bold text-amber-600">{company.needSupportCount} Peserta</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Batches */}
      {activeTab === "batches" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Daftar Batch {company.name}</h2>
          <div className="divide-y divide-[#EAE5D9]">
            {batches.map((b) => (
              <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#071A33] text-sm">{b.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Periode: {b.startDate} s/d {b.endDate}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#071A33] block">{b.participantCount} Peserta</span>
                    <span className="text-[11px] font-mono text-[#C79A3C] font-bold">{b.accessCode}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#0B2C6B] text-white text-xs font-bold">
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Coaches */}
      {activeTab === "coaches" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Coach Pendamping Dedicated</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(companyCoaches.length > 0 ? companyCoaches : INITIAL_COACHES).map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#071A33] text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.email}</p>
                </div>
                <span className="text-xs font-bold text-[#0B2C6B] bg-white px-3 py-1 rounded.lg border border-[#EAE5D9]">
                  {c.participantCount} Peserta
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Participants */}
      {activeTab === "participants" && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33]">Daftar Peserta Corporate</h2>
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
              {(companyParticipants.length > 0 ? companyParticipants : INITIAL_PARTICIPANTS).map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF8F4]">
                  <td className="py-3 font-bold text-[#071A33]">{p.name}<br /><span className="text-slate-400 font-normal">{p.email}</span></td>
                  <td className="py-3 text-slate-600 font-medium">{p.batchName}</td>
                  <td className="py-3 text-slate-600 font-medium">{p.coachName}</td>
                  <td className="py-3 font-bold text-emerald-600">{p.habitAvgPercent}%</td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Analytics */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Rata-rata Completion</span>
            <div className="text-3xl font-extrabold text-[#071A33]">{company.habitCompletionPercent}%</div>
            <p className="text-xs text-emerald-600 font-semibold">Tinggi melebihi rata-rata nasional</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Penyelesaian Checkpoint</span>
            <div className="text-3xl font-extrabold text-[#071A33]">{company.checkpointCompletionPercent}%</div>
            <p className="text-xs text-emerald-600 font-semibold">Checkpoint 1 & 2 tuntas</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-[#EAE5D9] space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Need Support Rate</span>
            <div className="text-3xl font-extrabold text-amber-600">{company.needSupportCount} Peserta</div>
            <p className="text-xs text-amber-600 font-semibold">Dalam pendampingan coach</p>
          </div>
        </div>
      )}
    </div>
  );
}
