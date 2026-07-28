"use client";

import { useEffect, useState } from "react";
import { Users, Search, Building2, Layers, UserCheck, ShieldAlert } from "lucide-react";
import {
  getStoredCompanies,
  getStoredBatches,
  INITIAL_PARTICIPANTS,
  AdminParticipant,
  Company,
  Batch,
} from "@/lib/company-store";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");

  useEffect(() => {
    setCompanies(getStoredCompanies());
    setBatches(getStoredBatches());
    setParticipants(INITIAL_PARTICIPANTS);
  }, []);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompanyFilter === "all" || p.companyId === selectedCompanyFilter;
    const matchesBatch = selectedBatchFilter === "all" || p.batchId === selectedBatchFilter;
    return matchesSearch && matchesCompany && matchesBatch;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
            Participants (Daftar Peserta)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Monitoring seluruh peserta terdaftar, alokasi batch, coach, dan status progres.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari peserta, email, atau perusahaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          />
        </div>

        {/* Company & Batch Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => {
              setSelectedCompanyFilter(e.target.value);
              setSelectedBatchFilter("all");
            }}
            className="px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          >
            <option value="all">Semua Company ({companies.length})</option>
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
            {batches
              .filter((b) => selectedCompanyFilter === "all" || b.companyId === selectedCompanyFilter)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9] text-slate-400 font-bold">
                <th className="p-4 font-semibold">Nama Peserta</th>
                <th className="p-4 font-semibold">Company (Perusahaan)</th>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Coach Pendamping</th>
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Progres Habit</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF8F4]/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-[#071A33]">{p.name}</div>
                    <div className="text-slate-400 text-[11px] font-normal">{p.email}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#C79A3C]" />
                      <span>{p.companyName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-600">{p.batchName}</td>
                  <td className="p-4 font-medium text-slate-600">{p.coachName}</td>
                  <td className="p-4 font-mono font-bold text-[#0B2C6B]">{p.accessCode}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.habitAvgPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${p.habitAvgPercent}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700">{p.habitAvgPercent}%</span>
                    </div>
                  </td>
                  <td className="p-4">
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
    </div>
  );
}
