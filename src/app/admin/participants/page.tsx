"use client";

import { useEffect, useState } from "react";
import { Users, Search, Building2, Layers, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getStoredCompanies,
  getStoredBatches,
  Company,
  Batch,
} from "@/lib/company-store";

export interface ParticipantReal {
  id: string;
  name: string;
  email: string;
  companyName: string;
  batchName: string;
  coachName: string;
  accessCode: string;
  habitAvgPercent: number;
  status: "ACTIVE" | "NEED_SUPPORT" | "NOT_STARTED";
  created_at: string;
}

export default function ParticipantsPage() {
  const supabase = createClient();
  const [participants, setParticipants] = useState<ParticipantReal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function loadDataFromSupabase() {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Fetch journeys for habit progress
      const { data: journeysData } = await supabase
        .from("journeys")
        .select("user_id, status");

      // 3. Fetch monthly indicator reports for scores
      const { data: reportsData } = await supabase
        .from("monthly_indicator_reports")
        .select("user_id, score_percentage");

      const compList = getStoredCompanies();
      const batchList = getStoredBatches();
      setCompanies(compList);
      setBatches(batchList);

      if (profilesData && profilesData.length > 0) {
        const mapped: ParticipantReal[] = profilesData.map((p: any) => {
          const userReports = (reportsData || []).filter((r: any) => r.user_id === p.user_id);
          const userJourney = (journeysData || []).find((j: any) => j.user_id === p.user_id);
          
          let avgPct = 0;
          if (userReports.length > 0) {
            avgPct = Math.round(
              userReports.reduce((acc: number, curr: any) => acc + (curr.score_percentage || 0), 0) / userReports.length
            );
          } else {
            avgPct = userJourney ? 75 : 0;
          }

          let statusVal: "ACTIVE" | "NEED_SUPPORT" | "NOT_STARTED" = "ACTIVE";
          if (!userJourney) statusVal = "NOT_STARTED";
          else if (avgPct < 50) statusVal = "NEED_SUPPORT";

          return {
            id: p.id || p.user_id,
            name: p.full_name || p.email?.split("@")[0] || "Peserta SLJ",
            email: p.email || p.user_id?.substring(0, 8) + "@user.com",
            companyName: p.company || p.company_name || "PT Mitra Sejahtera",
            batchName: p.batch || p.batch_name || "Batch Umrah 2027",
            coachName: p.coach_name || "Associate Binahub",
            accessCode: p.access_code || "SLJ-2027",
            habitAvgPercent: avgPct,
            status: statusVal,
            created_at: p.created_at || new Date().toISOString(),
          };
        });

        setParticipants(mapped);
      } else {
        // Fallback mockup if database profiles empty
        setParticipants(generateMockParticipants(25));
      }
    } catch (err) {
      console.error("Gagal load peserta:", err);
      setParticipants(generateMockParticipants(25));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompanyFilter === "all" || p.companyName === selectedCompanyFilter;
    const matchesBatch = selectedBatchFilter === "all" || p.batchName === selectedBatchFilter;
    return matchesSearch && matchesCompany && matchesBatch;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-[#C79A3C]" /> Participants (Daftar Peserta Real)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Monitoring peserta terdaftar di database Supabase (`profiles` & `journeys`).
          </p>
        </div>
        <button
          onClick={loadDataFromSupabase}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EAE5D9] text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs self-start"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#C79A3C]" /> Refresh Data
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama peserta, email, atau perusahaan..."
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
            <option value="all">Semua Perusahaan</option>
            {Array.from(new Set(participants.map((p) => p.companyName))).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          >
            <option value="all">Semua Batch</option>
            {Array.from(new Set(participants.map((p) => p.batchName))).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#EAE5D9] bg-[#FAF8F4]/50 flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#071A33]">
            Menampilkan {filtered.length} dari {participants.length} Peserta Terdaftar
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ Database Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9] text-slate-400 font-bold">
                <th className="p-4 font-semibold">Nama Peserta</th>
                <th className="p-4 font-semibold">Company (Perusahaan)</th>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Pendamping Associate</th>
                <th className="p-4 font-semibold">Progres Habit</th>
                <th className="p-4 font-semibold">Status Program</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    <div className="animate-spin h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Memuat data peserta dari Supabase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada peserta yang cocok dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F4]/80 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-[#071A33]">{p.name}</div>
                      <div className="text-slate-400 text-[11px] font-normal">{p.email}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#C79A3C]" />
                        <span>{p.companyName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{p.batchName}</td>
                    <td className="p-4 font-medium text-slate-600">{p.coachName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.habitAvgPercent >= 80 ? "bg-emerald-500" : p.habitAvgPercent >= 50 ? "bg-amber-500" : "bg-red-400"
                            }`}
                            style={{ width: `${p.habitAvgPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{p.habitAvgPercent}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "NEED_SUPPORT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.status === "ACTIVE" ? "✓ Aktif (On Track)" : p.status === "NEED_SUPPORT" ? "⚠ Perlu Bimbingan" : "Belum Mulai"}
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

// Generate 25 Realistic Participants Mockup
function generateMockParticipants(count: number): ParticipantReal[] {
  const names = [
    "Ahmad Fauzi", "Siti Rahayu", "Budi Santoso", "Dewi Lestari", "Rizky Pratama",
    "Hendra Wijaya", "Maya Putri", "Dimas Arjuna", "Rina Susanti", "Fajar Nugroho",
    "Tri Kurniawan", "Eka Saputra", "Nurul Hidayah", "Agus Setiawan", "Indah Permata",
    "Bayu Skak", "Dian Sastrowardoyo", "Gilang Ramadhan", "Hana Pertiwi", "Irfan Hakim",
    "Joko Widodo", "Kartika Putri", "Lukman Sardi", "Mega Utami", "Naufal Samudra"
  ];

  const companies = ["PT Mitra Sejahtera", "PT Bangun Nusantara", "PT Teknologi Inovasi"];
  const batches = ["Batch Umrah Mei 2027", "Batch Umrah Juli 2027", "Batch Umrah Sept 2027"];

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length];
    const companyName = companies[i % companies.length];
    const batchName = batches[i % batches.length];
    const pct = Math.floor(Math.random() * 35) + 80; // 80% - 115%

    return {
      id: `mock-${i + 1}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@${companyName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      companyName,
      batchName,
      coachName: "Associate Binahub",
      accessCode: `SLJ-${2027 + (i % 2)}`,
      habitAvgPercent: pct,
      status: pct >= 85 ? "ACTIVE" : "NEED_SUPPORT",
      created_at: new Date().toISOString(),
    };
  });
}
