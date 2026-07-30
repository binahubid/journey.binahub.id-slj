"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Download,
  CheckCircle2,
  Building2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  UserCheck,
  Sparkles,
  ChevronRight,
  Calendar,
  User,
  Heart,
  Briefcase,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  Lock,
  PieChart as PieIcon,
  Activity,
  Check,
  Star,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ParticipantReport {
  id: string;
  name: string;
  productivity: string; // 132%
  discipline: string; // 92%
  absenteeism: string; // 6%
  integrityScore: string; // 98%
  impactScore: string; // A+, A, A-
  ratingAtasan: number; // 5
  status: "Excellent" | "Very Good" | "Good";
}

const MOCK_PARTICIPANTS: ParticipantReport[] = [
  { id: "1", name: "Ahmad Fauzi", productivity: "132%", discipline: "92%", absenteeism: "6%", integrityScore: "98%", impactScore: "A+", ratingAtasan: 5, status: "Excellent" },
  { id: "2", name: "Siti Rahayu", productivity: "128%", discipline: "89%", absenteeism: "7%", integrityScore: "96%", impactScore: "A", ratingAtasan: 5, status: "Excellent" },
  { id: "3", name: "Budi Santoso", productivity: "126%", discipline: "88%", absenteeism: "8%", integrityScore: "95%", impactScore: "A", ratingAtasan: 4, status: "Very Good" },
  { id: "4", name: "Dewi Lestari", productivity: "124%", discipline: "93%", absenteeism: "5%", integrityScore: "97%", impactScore: "A-", ratingAtasan: 5, status: "Excellent" },
  { id: "5", name: "Rizky Pratama", productivity: "122%", discipline: "91%", absenteeism: "6%", integrityScore: "94%", impactScore: "A-", ratingAtasan: 4, status: "Excellent" },
  { id: "6", name: "Hendra Wijaya", productivity: "119%", discipline: "87%", absenteeism: "9%", integrityScore: "92%", impactScore: "B+", ratingAtasan: 4, status: "Very Good" },
  { id: "7", name: "Maya Putri", productivity: "118%", discipline: "86%", absenteeism: "8%", integrityScore: "91%", impactScore: "B+", ratingAtasan: 4, status: "Good" },
  { id: "8", name: "Dimas Arjuna", productivity: "135%", discipline: "95%", absenteeism: "4%", integrityScore: "99%", impactScore: "A+", ratingAtasan: 5, status: "Excellent" },
  { id: "9", name: "Rina Susanti", productivity: "127%", discipline: "90%", absenteeism: "7%", integrityScore: "96%", impactScore: "A", ratingAtasan: 5, status: "Very Good" },
  { id: "10", name: "Fajar Nugroho", productivity: "121%", discipline: "88%", absenteeism: "8%", integrityScore: "93%", impactScore: "A-", ratingAtasan: 4, status: "Good" },
  { id: "11", name: "Tri Kurniawan", productivity: "117%", discipline: "85%", absenteeism: "10%", integrityScore: "90%", impactScore: "B+", ratingAtasan: 4, status: "Good" },
  { id: "12", name: "Eka Saputra", productivity: "129%", discipline: "92%", absenteeism: "5%", integrityScore: "97%", impactScore: "A", ratingAtasan: 5, status: "Excellent" },
  { id: "13", name: "Nurul Hidayah", productivity: "123%", discipline: "89%", absenteeism: "7%", integrityScore: "95%", impactScore: "A-", ratingAtasan: 4, status: "Very Good" },
  { id: "14", name: "Agus Setiawan", productivity: "116%", discipline: "84%", absenteeism: "9%", integrityScore: "89%", impactScore: "B+", ratingAtasan: 4, status: "Good" },
  { id: "15", name: "Indah Permata", productivity: "130%", discipline: "93%", absenteeism: "5%", integrityScore: "98%", impactScore: "A", ratingAtasan: 5, status: "Excellent" },
  { id: "16", name: "Bayu Skak", productivity: "122%", discipline: "88%", absenteeism: "8%", integrityScore: "93%", impactScore: "A-", ratingAtasan: 4, status: "Very Good" },
  { id: "17", name: "Dian Sastrowardoyo", productivity: "134%", discipline: "94%", absenteeism: "4%", integrityScore: "99%", impactScore: "A+", ratingAtasan: 5, status: "Excellent" },
  { id: "18", name: "Gilang Ramadhan", productivity: "118%", discipline: "86%", absenteeism: "9%", integrityScore: "91%", impactScore: "B+", ratingAtasan: 4, status: "Good" },
  { id: "19", name: "Hana Pertiwi", productivity: "128%", discipline: "91%", absenteeism: "6%", integrityScore: "96%", impactScore: "A", ratingAtasan: 5, status: "Very Good" },
  { id: "20", name: "Irfan Hakim", productivity: "124%", discipline: "89%", absenteeism: "7%", integrityScore: "95%", impactScore: "A-", ratingAtasan: 4, status: "Excellent" },
  { id: "21", name: "Joko Widodo", productivity: "136%", discipline: "96%", absenteeism: "3%", integrityScore: "100%", impactScore: "A+", ratingAtasan: 5, status: "Excellent" },
  { id: "22", name: "Kartika Putri", productivity: "126%", discipline: "90%", absenteeism: "7%", integrityScore: "95%", impactScore: "A", ratingAtasan: 4, status: "Very Good" },
  { id: "23", name: "Lukman Sardi", productivity: "120%", discipline: "87%", absenteeism: "8%", integrityScore: "92%", impactScore: "A-", ratingAtasan: 4, status: "Good" },
  { id: "24", name: "Mega Utami", productivity: "117%", discipline: "85%", absenteeism: "9%", integrityScore: "90%", impactScore: "B+", ratingAtasan: 4, status: "Good" },
  { id: "25", name: "Naufal Samudra", productivity: "129%", discipline: "92%", absenteeism: "6%", integrityScore: "97%", impactScore: "A", ratingAtasan: 5, status: "Excellent" },
];

export default function ImpactReportPage() {
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showExecModal, setShowExecModal] = useState(false);

  const displayedParticipants = showAllParticipants ? MOCK_PARTICIPANTS : MOCK_PARTICIPANTS.slice(0, 5);
  const handleExportPDF = () => window.print();

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      
      {/* ─── SECTION 1: HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#C79A3C]" />
            <h1 className="text-2xl font-black text-[#071A33] tracking-tight">
              Corporate Impact & ROI Report 2026
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Evaluasi dampak bisnis program SLJ 90 Hari terhadap 25 peserta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Section 2: Data Verification Panel */}
          <div className="flex items-center gap-2.5 bg-white border border-[#EAE5D9] rounded-xl px-3 py-1.5 shadow-2xs">
            <div className="flex -space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-navy-900 text-amber-400 font-bold text-[9px] flex items-center justify-center border border-white">HR</div>
              <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">SPV</div>
              <div className="h-6 w-6 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">CCH</div>
            </div>
            <div className="text-left leading-tight">
              <span className="text-[10px] font-bold text-slate-500 block">Data Telah Diverifikasi</span>
              <span className="text-[11px] font-black text-emerald-600">98% Data tervalidasi</span>
            </div>
          </div>

          {/* Evaluation Period Selector & Export */}
          <div className="flex items-center gap-2">
            <div className="bg-white border border-[#EAE5D9] rounded-xl px-3 py-2 text-xs font-bold text-[#071A33] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#C79A3C]" />
              <span>Periode Evaluasi: 90 Hari</span>
            </div>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md"
            >
              <Download className="h-4 w-4 text-amber-400" /> Export Board Meeting PDF
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE CONTAINER */}
      <div id="print-area" className="space-y-6">

        {/* ─── SECTION 3: HERO EXECUTIVE SUMMARY (FULL NAVY HERO CARD) ─── */}
        <div className="bg-[#071A33] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-navy-900 relative overflow-hidden">
          <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-widest block mb-4">
            EXECUTIVE BUSINESS IMPACT SUMMARY
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Main Value Figures */}
            <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-blue-900/80 pb-6 lg:pb-0 lg:pr-8">
              <div>
                <span className="text-xs text-blue-200 font-semibold block">Investasi Program SLJ (25 Peserta)</span>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
                  Rp 350.000.000
                </div>
              </div>

              <div className="pt-1">
                <div className="text-slate-400 text-xs py-1 flex items-center gap-2">
                  <span className="h-4 w-0.5 bg-amber-400 rounded-full" />
                  <span>menghasilkan estimasi efisiensi operasional senilai</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight mt-0.5">
                  Rp 970.000.000
                </div>
              </div>

              {/* Data Validated Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-bold text-slate-300">
                <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Data tervalidasi oleh:
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <User className="h-3 w-3 text-blue-300" /> HR Director
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-amber-300" /> Direct Superior
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-purple-300" /> Coach
                </span>
              </div>
            </div>

            {/* Right Metric Columns (5 Key Metrics) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {/* TOTAL ROI */}
              <div className="space-y-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">TOTAL ROI</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">277%</div>
                <span className="text-[9px] text-blue-300 font-medium block">Return on Investment</span>
                <div className="pt-1 flex justify-center text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              {/* INVESTASI PROGRAM */}
              <div className="space-y-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">INVESTASI PROGRAM</span>
                <div className="text-base sm:text-lg font-black text-white mt-1">Rp 350M</div>
                <span className="text-[9px] text-blue-300 font-medium block">Total Biaya Execution</span>
              </div>

              {/* ESTIMASI BENEFIT */}
              <div className="space-y-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">ESTIMASI BENEFIT</span>
                <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">Rp 970M</div>
                <span className="text-[9px] text-blue-300 font-medium block">Total Economic Value</span>
              </div>

              {/* NET BENEFIT */}
              <div className="space-y-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">NET BENEFIT</span>
                <div className="text-base sm:text-lg font-black text-amber-300 mt-1">Rp 620M</div>
                <span className="text-[9px] text-blue-300 font-medium block">Keuntungan Bersih</span>
              </div>

              {/* PAYBACK PERIOD */}
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">PAYBACK PERIOD</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">4.2 Bln</div>
                <span className="text-[9px] text-blue-300 font-medium block">Modal Kembali</span>
                <div className="pt-1 flex justify-center text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-900/60 text-center">
            <p className="text-xs text-blue-200 font-medium italic">
              &ldquo;Investasi yang memberikan dampak nyata pada performa tim dan efisiensi operasional perusahaan.&rdquo;
            </p>
          </div>
        </div>


        {/* ─── SECTION 4 & 5: ROI TREND & EXECUTIVE SUMMARY ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECTION 4: ROI TREND (LINE CHART 3 BULAN) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE5D9] pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-[#071A33] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" /> ROI Trend (Return on Investment)
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Perkembangan ROI dari bulan ke bulan (Bln 1 s/d Bln 3)</span>
              </div>
              <span className="text-xs font-bold bg-[#FAF8F4] border border-[#EAE5D9] px-3 py-1 rounded-xl text-slate-600">
                3 Bulan (Program 90 Hari)
              </span>
            </div>

            {/* SVG Line Chart for ROI Trend (3 Bulan) */}
            <div className="h-48 w-full pt-4 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                {/* Trend Line Path (Bln 1: 80% -> Bln 2: 175% -> Bln 3: 277%) */}
                <path
                  d="M 50 120 L 250 65 L 450 15"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points & Labels */}
                {[
                  { x: 50, y: 120, label: "80%", month: "Bulan 1 (Hari 30)" },
                  { x: 250, y: 65, label: "175%", month: "Bulan 2 (Hari 60)" },
                  { x: 450, y: 15, label: "277%", month: "Bulan 3 (Hari 90)" },
                ].map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="6" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="text-[11px] font-black fill-[#071A33]">
                      {pt.label}
                    </text>
                    <text x={pt.x} y={145} textAnchor="middle" className="text-[10px] font-bold fill-slate-500">
                      {pt.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* SECTION 5: EXECUTIVE SUMMARY TEXT BOX */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#071A33]">Executive Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Selama 90 hari pelaksanaan Program SLJ Batch Executive 2026, terdapat peningkatan signifikan pada seluruh indikator kinerja utama. Program ini menghasilkan estimasi efisiensi operasional senilai <strong className="text-[#071A33]">Rp 970.000.000</strong> dengan <strong className="text-amber-700">ROI 277%</strong> dan payback period <strong className="text-emerald-700">4.2 bulan</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowExecModal(true)}
              className="w-full py-2.5 rounded-xl border border-[#0B2C6B] text-[#0B2C6B] hover:bg-[#0B2C6B] hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>Lihat Executive Summary Detail</span> &rarr;
            </button>
          </div>
        </div>


        {/* ─── SECTION 6, 7, 8: BEFORE vs AFTER, BUSINESS IMPACT BREAKDOWN, KPI INDICATOR ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SECTION 6: Baseline Result (Before vs After) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#071A33]">Baseline Result (Before vs After)</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Sebelum</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#071A33]" /> Setelah 90 Hari</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs pt-1">
              {/* Row 1: Produktivitas */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Produktivitas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">100%</span>
                    <span className="text-[#071A33] font-black text-xs">122%</span>
                    <span className="text-emerald-600 font-bold text-[11px]">+22%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#071A33] rounded-full" style={{ width: "82%" }} />
                </div>
              </div>

              {/* Row 2: Tingkat Mangkir */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-600" /> Tingkat Mangkir</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">15%</span>
                    <span className="text-[#071A33] font-black text-xs">8%</span>
                    <span className="text-emerald-600 font-bold text-[11px]">-35%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#071A33] rounded-full" style={{ width: "45%" }} />
                </div>
              </div>

              {/* Row 3: Kedisiplinan & Integritas */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-purple-600" /> Kedisiplinan & Integritas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">72%</span>
                    <span className="text-[#071A33] font-black text-xs">91%</span>
                    <span className="text-emerald-600 font-bold text-[11px]">+26%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#071A33] rounded-full" style={{ width: "91%" }} />
                </div>
              </div>

              {/* Row 4: Kepemimpinan Tim */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-600" /> Kepemimpinan Tim</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">68%</span>
                    <span className="text-[#071A33] font-black text-xs">88%</span>
                    <span className="text-emerald-600 font-bold text-[11px]">+20%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#071A33] rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              {/* Row 5: Integrity Score */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-rose-600" /> Integrity Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">72%</span>
                    <span className="text-[#071A33] font-black text-xs">100%</span>
                    <span className="text-emerald-600 font-bold text-[11px]">+28%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#071A33] rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
            <span className="text-[9px] text-slate-400 block pt-1 font-medium">*Baseline diambil dari 30 hari sebelum program dimulai</span>
          </div>

          {/* SECTION 7: Business Impact Breakdown (Donut Chart 1) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#071A33]">Business Impact Breakdown</h3>
            
            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-purple-500" strokeWidth="5" strokeDasharray="48 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#0B2C6B]" strokeWidth="5" strokeDasharray="22 100" strokeDashoffset="-48" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-amber-500" strokeWidth="5" strokeDasharray="15 100" strokeDashoffset="-70" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeWidth="5" strokeDasharray="15 100" strokeDashoffset="-85" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">Total Benefit</span>
                  <span className="text-base font-black text-[#071A33]">Rp 970JT</span>
                </div>
              </div>

              <div className="w-full space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" /> Produktivitas Gain</span>
                  <span className="font-bold text-[#071A33]">48% <span className="text-[10px] font-normal text-slate-400">(Rp 470JT)</span></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0B2C6B] shrink-0" /> Reduced Turnover</span>
                  <span className="font-bold text-[#071A33]">22% <span className="text-[10px] font-normal text-slate-400">(Rp 210JT)</span></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" /> Lower Absenteeism</span>
                  <span className="font-bold text-[#071A33]">15% <span className="text-[10px] font-normal text-slate-400">(Rp 150JT)</span></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" /> Leadership Impact</span>
                  <span className="font-bold text-[#071A33]">15% <span className="text-[10px] font-normal text-slate-400">(Rp 140JT)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: Kinerja per Indikator (After 90 Hari) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#071A33]">Kinerja per Indikator (After 90 Hari)</h3>
            
            <div className="space-y-4 text-xs pt-1">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Produktivitas</span>
                  <span className="text-navy-900 font-extrabold">122%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-900 rounded-full" style={{ width: "81%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Leadership</span>
                  <span className="text-amber-600 font-extrabold">118%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Discipline</span>
                  <span className="text-emerald-600 font-extrabold">113%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "75%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Integrity</span>
                  <span className="text-purple-600 font-extrabold">132%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Team Collaboration</span>
                  <span className="text-blue-600 font-extrabold">108%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 font-bold pt-2 border-t border-slate-100">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>
        </div>


        {/* ─── SECTION 9 & 10: FINANCIAL IMPACT WATERFALL & COST SAVING BREAKDOWN ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* SECTION 9: FINANCIAL IMPACT WATERFALL CHART */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE5D9] pb-3">
              <h3 className="text-sm font-extrabold text-[#071A33]">Financial Impact Waterfall</h3>
              <span className="text-[10px] text-slate-400 font-semibold">Alur terbentuknya nilai bagi perusahaan</span>
            </div>

            {/* Waterfall Bar Chart Visual */}
            <div className="h-44 w-full pt-4 relative border-b border-slate-200">
              <div className="h-full flex items-end justify-between gap-2 px-4">
                {/* Bar 1: Investasi Program */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-slate-500 mb-1">350 jt</span>
                  <div className="w-full bg-[#071A33] rounded-t-lg h-[35%]" />
                  <span className="text-[9px] font-bold text-slate-600 mt-2 text-center">Investasi Program</span>
                </div>

                {/* Bar 2: Produktivitas Gain */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-emerald-600 mb-1">+470 jt</span>
                  <div className="w-full bg-emerald-500 rounded-t-lg h-[65%]" />
                  <span className="text-[9px] font-bold text-slate-600 mt-2 text-center">Produktivitas Gain</span>
                </div>

                {/* Bar 3: Penurunan Turnover */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-emerald-600 mb-1">+210 jt</span>
                  <div className="w-full bg-emerald-400 rounded-t-lg h-[45%]" />
                  <span className="text-[9px] font-bold text-slate-600 mt-2 text-center">Penurunan Turnover</span>
                </div>

                {/* Bar 4: Penurunan Mangkir */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-emerald-600 mb-1">+150 jt</span>
                  <div className="w-full bg-emerald-400/80 rounded-t-lg h-[35%]" />
                  <span className="text-[9px] font-bold text-slate-600 mt-2 text-center">Penurunan Mangkir</span>
                </div>

                {/* Bar 5: Efisiensi Meeting */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-emerald-600 mb-1">+90 jt</span>
                  <div className="w-full bg-emerald-300 rounded-t-lg h-[25%]" />
                  <span className="text-[9px] font-bold text-slate-600 mt-2 text-center">Efisiensi Meeting</span>
                </div>

                {/* Bar 6: Total Benefit */}
                <div className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[9px] font-black text-amber-600 mb-1">970 jt</span>
                  <div className="w-full bg-amber-500 rounded-t-lg h-[100%]" />
                  <span className="text-[9px] font-black text-[#071A33] mt-2 text-center">Total Benefit (90 Hari)</span>
                </div>
              </div>
            </div>

            {/* Sub Formula Bar */}
            <div className="grid grid-cols-4 gap-2 bg-[#FAF8F4] border border-[#EAE5D9] rounded-2xl p-3 text-center text-xs font-bold">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Investasi Program</span>
                <span className="text-[#071A33]">Rp 350.000.000</span>
              </div>
              <div>
                <span className="text-[9px] text-emerald-600 block uppercase">Total Benefit</span>
                <span className="text-emerald-700">Rp 970.000.000</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-700 block uppercase">Net Benefit</span>
                <span className="text-amber-800">Rp 620.000.000</span>
              </div>
              <div className="bg-amber-100 rounded-xl p-1 text-amber-900 font-black">
                <span className="text-[9px] block uppercase">ROI</span>
                <span>277%</span>
              </div>
            </div>
          </div>

          {/* SECTION 10: COST SAVING BREAKDOWN (DONUT CHART 2) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-[#071A33]">Cost Saving Breakdown</h3>

            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#071A33]" strokeWidth="5" strokeDasharray="48 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-amber-500" strokeWidth="5" strokeDasharray="22 100" strokeDashoffset="-48" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeWidth="5" strokeDasharray="15 100" strokeDashoffset="-70" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-purple-500" strokeWidth="5" strokeDasharray="9 100" strokeDashoffset="-85" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-slate-400" strokeWidth="5" strokeDasharray="6 100" strokeDashoffset="-94" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400">Total Saving</span>
                  <span className="text-base font-black text-[#071A33]">Rp 970JT</span>
                </div>
              </div>

              <div className="w-full space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#071A33] shrink-0" /> Produktivitas Gain</span>
                  <span className="font-bold text-[#071A33]">Rp 470.000.000 (48%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" /> Penurunan Turnover</span>
                  <span className="font-bold text-[#071A33]">Rp 210.000.000 (22%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" /> Penurunan Mangkir</span>
                  <span className="font-bold text-[#071A33]">Rp 150.000.000 (15%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" /> Efisiensi Meeting</span>
                  <span className="font-bold text-[#071A33]">Rp 90.000.000 (9%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" /> Peningkatan Kepemimpinan</span>
                  <span className="font-bold text-[#071A33]">Rp 50.000.000 (6%)</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center italic">Estimasi penghematan dihitung berdasarkan data aktual dan asumsi konservatif perusahaan.</p>
          </div>
        </div>


        {/* ─── SECTION 11 & 12: TOP 5 PESERTA & LEADERSHIP COMPETENCY RADAR ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* SECTION 11: TOP 5 PERFORMA PESERTA TABLE */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#071A33]">Top 5 Performa Peserta</h3>
              <button
                onClick={() => setShowAllParticipants(!showAllParticipants)}
                className="text-xs font-bold text-[#0B2C6B] hover:underline flex items-center gap-1 print:hidden"
              >
                {showAllParticipants ? "Sembunyikan" : "Lihat Semua 25 Peserta"} &rarr;
              </button>
            </div>

            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE5D9] text-slate-400 font-bold text-[10px]">
                    <th className="pb-2 font-semibold">No</th>
                    <th className="pb-2 font-semibold">Nama Peserta</th>
                    <th className="pb-2 font-semibold text-center">Produktivitas</th>
                    <th className="pb-2 font-semibold text-center">Kedisiplinan</th>
                    <th className="pb-2 font-semibold text-center">Mangkir</th>
                    <th className="pb-2 font-semibold text-center">Integrity Score</th>
                    <th className="pb-2 font-semibold text-center">Impact Score</th>
                    <th className="pb-2 font-semibold text-center">Rating Atasan</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5D9]">
                  {displayedParticipants.map((p, i) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F4]/80 transition-colors">
                      <td className="py-2.5 font-bold text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="py-2.5 font-bold text-[#071A33]">{p.name}</td>
                      <td className="py-2.5 font-bold text-center text-emerald-600">{p.productivity}</td>
                      <td className="py-2.5 font-bold text-center text-slate-700">{p.discipline}</td>
                      <td className="py-2.5 font-bold text-center text-blue-600">{p.absenteeism}</td>
                      <td className="py-2.5 font-bold text-center text-purple-600">{p.integrityScore}</td>
                      <td className="py-2.5 font-black text-center text-[#0B2C6B]">{p.impactScore}</td>
                      <td className="py-2.5 text-center text-amber-500 font-bold">
                        {"★".repeat(p.ratingAtasan)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            p.status === "Excellent"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
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

          {/* SECTION 12: LEADERSHIP COMPETENCY RADAR CHART */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#071A33]">Leadership Competency Radar</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#071A33]" /> Sebelum</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Setelah</span>
              </div>
            </div>

            {/* SVG Radar Polygon Visual */}
            <div className="h-48 w-full flex items-center justify-center relative">
              <svg className="h-44 w-44 overflow-visible" viewBox="0 0 200 200">
                {/* Radar Grid Circles / Hexagons */}
                <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="100,45 145,70 145,130 100,155 55,130 55,70" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                <polygon points="100,70 120,85 120,115 100,130 80,115 80,85" fill="none" stroke="#f1f5f9" strokeWidth="1" />

                {/* Axis Lines */}
                <line x1="100" y1="100" x2="100" y2="20" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="100" x2="170" y2="60" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="100" x2="170" y2="140" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="100" x2="100" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="100" x2="30" y2="140" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="100" y1="100" x2="30" y2="60" stroke="#cbd5e1" strokeWidth="1" />

                {/* Polygon 1: Sebelum Program (Navy Solid) */}
                <polygon points="100,55 135,80 135,120 100,140 65,120 65,80" fill="#071A33" fillOpacity="0.2" stroke="#071A33" strokeWidth="2" />

                {/* Polygon 2: Setelah 90 Hari (Amber Gold) */}
                <polygon points="100,25 160,65 160,135 100,170 40,135 40,65" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2.5" />

                {/* Axis Labels */}
                <text x="100" y="12" textAnchor="middle" className="text-[9px] font-bold fill-[#071A33]">Leadership</text>
                <text x="180" y="60" textAnchor="start" className="text-[9px] font-bold fill-slate-500">Collaboration</text>
                <text x="180" y="145" textAnchor="start" className="text-[9px] font-bold fill-slate-500">Productivity</text>
                <text x="100" y="195" textAnchor="middle" className="text-[9px] font-bold fill-slate-500">Discipline</text>
                <text x="20" y="145" textAnchor="end" className="text-[9px] font-bold fill-slate-500">Spiritual Growth</text>
                <text x="20" y="60" textAnchor="end" className="text-[9px] font-bold fill-[#071A33]">Integrity</text>
              </svg>
            </div>

            <span className="text-[9px] text-slate-400 text-center block">Perkembangan 6 kompetensi karakter kepemimpinan secara menyeluruh.</span>
          </div>

        </div>


        {/* ─── SECTION 13: EXECUTIVE RECOMMENDATION (NAVY FOOTER BANNER) ─── */}
        <div className="bg-[#071A33] text-white rounded-3xl p-6 shadow-xl border border-navy-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Star className="h-6 w-6 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Executive Recommendation</h3>
              <p className="text-xs text-blue-200 mt-0.5 max-w-xl leading-relaxed">
                Program SLJ 90 Hari Batch Executive 2026 memberikan dampak bisnis yang signifikan dan terukur. Dari sisi finansial, program ini menghasilkan ROI 277% dengan payback period 4.2 bulan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-l border-blue-900/80 pt-4 md:pt-0 md:pl-6 shrink-0">
            {/* Box 1: ROI Positif */}
            <div className="space-y-0.5 text-center">
              <span className="text-[9px] text-blue-200 font-bold uppercase block">ROI Positif</span>
              <span className="text-sm font-black text-amber-400 block">277% dalam 90 hari</span>
            </div>

            {/* Box 2: Produktivitas Naik */}
            <div className="space-y-0.5 text-center">
              <span className="text-[9px] text-blue-200 font-bold uppercase block">Produktivitas Naik</span>
              <span className="text-sm font-black text-emerald-400 block">+22% dari baseline</span>
            </div>

            {/* Box 3: Mangkir Turun */}
            <div className="space-y-0.5 text-center">
              <span className="text-[9px] text-blue-200 font-bold uppercase block">Mangkir Turun</span>
              <span className="text-sm font-black text-emerald-400 block">-35% dari baseline</span>
            </div>

            {/* Box 4: Integrity Naik */}
            <div className="space-y-0.5 text-center">
              <span className="text-[9px] text-blue-200 font-bold uppercase block">Integrity Naik</span>
              <span className="text-sm font-black text-purple-300 block">98% integrity score</span>
            </div>

            {/* Box 5: Layak Dilanjutkan */}
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-4 py-2 text-center text-emerald-300">
              <span className="text-[9px] font-bold block uppercase">Layak Dilanjutkan</span>
              <span className="text-xs font-black block">Rekomendasi: YES</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── MODAL EXECUTIVE SUMMARY DETAIL ─── */}
      {showExecModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#EAE5D9] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE5D9] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#C79A3C] tracking-wider block">Official Executive Briefing</span>
                <h3 className="text-lg font-black text-[#071A33]">Detail Ringkasan Eksekutif Program SLJ 90 Hari</h3>
              </div>
              <button
                onClick={() => setShowExecModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>Ringkasan Eksekutif Board Meeting 2026:</strong><br />
                Pelaksanaan Program Spiritual Leadership Journey (SLJ) 90 Hari untuk 25 karyawan Executive PT Mitra Sejahtera telah berhasil diselesaikan dengan hasil bisnis yang sangat memuaskan melebihi ekspektasi awal.
              </p>
              
              <div className="bg-[#FAF8F4] border border-[#EAE5D9] rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-[#071A33]">Poin Kunci Keputusan Direksi:</h4>
                <ul className="list-disc list-inside space-y-1 font-semibold text-slate-700">
                  <li><strong>Total Penghematan Efisiensi (Cost Saving)</strong>: Rp 970.000.000.</li>
                  <li><strong>Investasi Program Execution</strong>: Rp 350.000.000.</li>
                  <li><strong>Nett Financial Profit</strong>: Rp 620.000.000 (ROI 277%).</li>
                  <li><strong>Payback Period</strong>: Modal investasi kembali sepenuhnya dalam 4.2 bulan.</li>
                </ul>
              </div>

              <p>
                <strong>Rekomendasi Lanjutan:</strong><br />
                Berdasarkan validasi atasan (rating 4.8/5.0) dan skor integritas 100%, disarankan kepada jajaran Direksi untuk menyetujui alokasi anggaran peluncuran SLJ Batch 2 & 3 bagi level Manager & Supervisor.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EAE5D9]">
              <button
                onClick={() => setShowExecModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-xs font-bold hover:bg-[#071A33]"
              >
                Tutup Ringkasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print CSS Fix for Board Deck Export */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 8px;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
