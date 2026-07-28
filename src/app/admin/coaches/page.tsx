"use client";

import { useEffect, useState } from "react";
import { UserCheck, ShieldAlert, Building2, Layers, Search, Mail } from "lucide-react";
import { INITIAL_COACHES, AdminCoach } from "@/lib/company-store";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setCoaches(INITIAL_COACHES);
  }, []);

  const filtered = coaches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
            Coaches (Coach Pendamping)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Monitoring distribusi alokasi bimbingan peserta dan beban kerja antar coach.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari coach atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
        />
      </div>

      {/* Coaches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                {c.status}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#071A33]">{c.name}</h2>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {c.email}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EAE5D9]">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Bimbingan Peserta:</span>
                <span className="font-extrabold text-[#071A33]">{c.participantCount} Peserta</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Flag Perhatian:</span>
                <span className="font-bold text-amber-600">{c.activeFlagsCount} Active Flags</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Perusahaan Mitra:</span>
                <span className="font-medium text-slate-700">{c.assignedCompanies.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
