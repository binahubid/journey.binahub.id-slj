"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  Layers,
  UserCheck,
  Users,
  Search,
  Filter,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  getStoredCompanies,
  getStoredBatches,
  INITIAL_COACHES,
  INITIAL_PARTICIPANTS,
  Company,
  Batch,
  AdminCoach,
  AdminParticipant,
} from "@/lib/company-store";

export default function AdminMonitoringPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);

  // Drill-down filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");

  useEffect(() => {
    setCompanies(getStoredCompanies());
    setBatches(getStoredBatches());
    setCoaches(INITIAL_COACHES);
    setParticipants(INITIAL_PARTICIPANTS);
  }, []);

  // Filtered batches based on selected Company
  const availableBatches = batches.filter(
    (b) => selectedCompanyId === "all" || b.companyId === selectedCompanyId
  );

  // Filtered coaches based on selected Company
  const selectedCompObj = companies.find((c) => c.id === selectedCompanyId);
  const availableCoaches = coaches.filter(
    (c) => selectedCompanyId === "all" || (selectedCompObj && c.assignedCompanies.includes(selectedCompObj.name))
  );

  // Filtered participants matching all drill-down selections
  const filteredParticipants = participants.filter((p) => {
    const matchesComp = selectedCompanyId === "all" || p.companyId === selectedCompanyId;
    const matchesBatch = selectedBatchId === "all" || p.batchId === selectedBatchId;
    const matchesCoach = selectedCoachId === "all" || p.coachId === selectedCoachId;
    return matchesComp && matchesBatch && matchesCoach;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="border-b border-[#EAE5D9] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
          <Activity className="h-7 w-7 text-[#C79A3C]" /> Drill-down Program Monitoring
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Filter hierarki lengkap: Company &rarr; Batch &rarr; Coach &rarr; Participant.
        </p>
      </div>

      {/* Drill-down Controls Bar */}
      <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
          <Filter className="h-4 w-4 text-[#C79A3C]" />
          <span>Filter Hierarki Drill-Down</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Select Company */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">1. Company (Perusahaan)</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setSelectedBatchId("all");
                setSelectedCoachId("all");
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Perusahaan (All Companies)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.participantCount} Peserta)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Batch */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">2. Batch Rombongan</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
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

          {/* Step 3: Select Coach */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">3. Coach Pendamping</label>
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Coach ({availableCoaches.length})</option>
              {availableCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drill-down Breadcrumb */}
        <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto">
          <span className="font-bold text-[#0B2C6B]">Filter Aktif:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {selectedCompanyId === "all" ? "Semua Perusahaan" : selectedCompObj?.name}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {selectedBatchId === "all" ? "Semua Batch" : batches.find((b) => b.id === selectedBatchId)?.name}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {selectedCoachId === "all" ? "Semua Coach" : coaches.find((c) => c.id === selectedCoachId)?.name}
          </span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#071A33]">
            Hasil Drill-Down Peserta ({filteredParticipants.length} Peserta)
          </h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#EAE5D9] text-slate-400 font-bold">
              <th className="pb-3 font-semibold">Nama Peserta</th>
              <th className="pb-3 font-semibold">Perusahaan</th>
              <th className="pb-3 font-semibold">Batch</th>
              <th className="pb-3 font-semibold">Coach</th>
              <th className="pb-3 font-semibold">Progres Habit</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE5D9]">
            {filteredParticipants.map((p) => (
              <tr key={p.id} className="hover:bg-[#FAF8F4]/80">
                <td className="py-3.5">
                  <span className="font-extrabold text-[#071A33] block">{p.name}</span>
                  <span className="text-slate-400 text-[11px] font-normal">{p.email}</span>
                </td>
                <td className="py-3.5 font-bold text-slate-700">{p.companyName}</td>
                <td className="py-3.5 font-medium text-slate-600">{p.batchName}</td>
                <td className="py-3.5 font-medium text-slate-600">{p.coachName}</td>
                <td className="py-3.5 font-bold text-emerald-600">{p.habitAvgPercent}%</td>
                <td className="py-3.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : p.status === "NEED_SUPPORT"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
