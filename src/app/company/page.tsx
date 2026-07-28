"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import { getStoredCompanies, getStoredBatches, Company, Batch } from "@/lib/company-store";

export default function CompanyDashboardPage() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const loadedCompanies = getStoredCompanies();
    setCompanies(loadedCompanies);
    if (loadedCompanies.length > 0) {
      setSelectedCompany(loadedCompanies[0]); // Default to PT Pertamina
    }
    setBatches(getStoredBatches());
  }, []);

  if (!selectedCompany) return null;

  const currentCompanyBatches = batches.filter((b) => b.companyId === selectedCompany.id || selectedCompany.name.includes(b.companyName));

  return (
    <div className="min-h-screen bg-[#FAF8F4] font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#EAE5D9] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0B2C6B] flex items-center justify-center text-[#C79A3C] font-extrabold text-sm shadow-md">
              HR
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#C79A3C]" /> {selectedCompany.name} — Corporate HR Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium">BinaHub Spiritual Leadership Journey</p>
            </div>
          </div>

          {/* Company Switcher for Demo */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Pilih Entitas HR:</span>
            <select
              value={selectedCompany.id}
              onChange={(e) => {
                const found = companies.find((c) => c.id === e.target.value);
                if (found) setSelectedCompany(found);
              }}
              className="px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin">
              <button className="px-3.5 py-2 rounded-xl border border-[#0B2C6B]/20 bg-white hover:bg-[#FAF8F4] text-[#071A33] text-xs font-bold transition-all">
                Portal Admin
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Privacy Lock Banner (Strict Privacy Notice as requested by User) */}
        <div className="p-4 rounded-2xl bg-[#0B2C6B] text-white border border-[#C79A3C]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C79A3C] shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Garansi Privasi 100%: Jurnal & Refleksi Karyawan Diberlakukan Privat
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Portal HR khusus menampilkan agregat statistik progres & kesehatan tim tanpa membaca atau mengakses jurnal pribadi karyawan.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#C79A3C]/20 border border-[#C79A3C]/40 text-[#C79A3C] text-[11px] font-extrabold whitespace-nowrap">
            STRICT HR PRIVACY PROTECTED
          </span>
        </div>

        {/* 3 Core HR Stat Cards (Requested explicitly by User) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 85% Habit Completion */}
          <div className="p-6 rounded-2xl border border-[#EAE5D9] bg-white space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Rata-rata Penyelesaian Habit (Habit Completion)</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-emerald-600">{selectedCompany.habitCompletionPercent}%</div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              Konsistensi kebiasaan positif karyawan selama 90 hari.
            </p>
          </div>

          {/* Card 2: 91% Checkpoint Complete */}
          <div className="p-6 rounded-2xl border border-[#EAE5D9] bg-white space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Checkpoint Complete</span>
              <div className="h-8 w-8 rounded-lg bg-[#C79A3C]/10 flex items-center justify-center text-[#C79A3C]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-[#071A33]">{selectedCompany.checkpointCompletionPercent}%</div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              Evaluasi bulanan (Hari 30, 60, 90) terselesaikan.
            </p>
          </div>

          {/* Card 3: 12 Need Support */}
          <div className="p-6 rounded-2xl border border-[#EAE5D9] bg-white space-y-2 shadow-2xs border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Need Support (Membutuhkan Perhatian)</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-amber-600">{selectedCompany.needSupportCount}</div>
            <p className="text-xs text-amber-700 font-medium pt-1">
              Karyawan sedang didampingi coach intensif (tanpa menghakimi).
            </p>
          </div>
        </div>

        {/* Corporate Batches Overview */}
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#EAE5D9] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#C79A3C]" /> Batch Rombongan Karyawan {selectedCompany.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Monitoring per gelombang keberangkatan Umrah & program 90 Hari</p>
            </div>
            <span className="text-xs font-bold text-[#0B2C6B]">
              Total: {selectedCompany.participantCount} Karyawan Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCompanyBatches.map((b) => (
              <div key={b.id} className="p-5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#071A33] text-sm">{b.name}</h3>
                  <span className="px-2.5 py-0.5 rounded bg-[#0B2C6B] text-white text-[10px] font-bold">
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Coach Pendamping: <strong className="text-[#071A33]">{b.coachName}</strong></p>
                  <p>Jumlah Karyawan: <strong className="text-[#071A33]">{b.participantCount} Peserta</strong></p>
                  <p>Kode Akses Batch: <strong className="font-mono text-[#0B2C6B]">{b.accessCode}</strong></p>
                </div>
                <div className="pt-2 border-t border-[#EAE5D9] flex items-center justify-between text-xs">
                  <span className="text-slate-500">Program Health Score:</span>
                  <span className="font-extrabold text-emerald-600">{b.healthScore} / 100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
