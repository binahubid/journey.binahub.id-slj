"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Download,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  Heart,
  Briefcase,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldCheck,
  Zap,
  ChevronRight,
  Target,
  Sparkles,
  MessageSquare,
  Flame,
  UserCheck,
  Compass,
  AlertTriangle,
  Lightbulb,
  Check,
} from "lucide-react";
import { TransformationRadarChart } from "@/components/domain/TransformationRadarChart";
import { DonutChart } from "@/components/domain/DonutChart";

interface ParticipantReport {
  id: string;
  name: string;
  role: string;
  company: string;
  coach: string;
  overallScore: number;
  status: "Excellent" | "Very Good" | "Good";
  topArea: string;
  productivity: string;
  discipline: string;
  ptpProgress: number;
  habits: { name: string; target: string; completion: number }[];
  radarData: { area: string; before: number; after: number }[];
  coachComment: string;
  safarComment: string;
}

const MOCK_PARTICIPANTS: ParticipantReport[] = [
  {
    id: "1",
    name: "Ahmad Fauzi",
    role: "Senior VP Operations",
    company: "PT Astra International Tbk",
    coach: "Dr. H. Bambang Setiawan",
    overallScore: 94,
    status: "Excellent",
    topArea: "Leadership Excellence",
    productivity: "132%",
    discipline: "94%",
    ptpProgress: 92,
    habits: [
      { name: "Tahajud 4 Rakaat & Istighfar 100x", target: "7x/minggu", completion: 95 },
      { name: "One-on-One Mentoring Tim Operasional", target: "2x/minggu", completion: 90 },
      { name: "Membaca Buku Kepemimpinan 15 Mnt", target: "7x/minggu", completion: 88 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 65, after: 95 },
      { area: "Personal Development", before: 60, after: 90 },
      { area: "Leadership Excellence", before: 58, after: 96 },
      { area: "Relationship & Community", before: 62, after: 88 },
      { area: "Professional Impact", before: 70, after: 94 },
    ],
    coachComment:
      "Ahmad menunjukkan komitmen istiqamah luar biasa. PTP operasional berjalan sesuai jadwal dan kepemimpinannya kini lebih empatik.",
    safarComment:
      "Aktif saling mengingatkan di grup Sahabat Safar. Menginspirasi peserta lain dalam menjaga amalan harian.",
  },
  {
    id: "2",
    name: "Siti Rahayu",
    role: "Head of Human Capital",
    company: "PT Astra International Tbk",
    coach: "Ust. Ahmad Rifai, M.Pd.",
    overallScore: 91,
    status: "Excellent",
    topArea: "Spiritual Growth",
    productivity: "128%",
    discipline: "92%",
    ptpProgress: 88,
    habits: [
      { name: "Sedekah Subuh & Tilawah 1 Juz", target: "7x/minggu", completion: 92 },
      { name: "Evaluasi Budaya Kerja Islami Tim", target: "1x/minggu", completion: 85 },
      { name: "Olahraga Ringan 20 Mnt", target: "3x/minggu", completion: 80 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 60, after: 94 },
      { area: "Personal Development", before: 62, after: 89 },
      { area: "Leadership Excellence", before: 55, after: 90 },
      { area: "Relationship & Community", before: 65, after: 92 },
      { area: "Professional Impact", before: 68, after: 90 },
    ],
    coachComment:
      "Siti berhasil mengintegrasikan nilai spiritual dalam kebijakan HC perusahaan. Budaya empati meningkat signifikan.",
    safarComment:
      "Sangat konsisten mencatat jurnal muhasabah harian dan menguatkan rekan se-kelompok.",
  },
  {
    id: "3",
    name: "Budi Santoso",
    role: "General Manager Supply Chain",
    company: "PT Astra International Tbk",
    coach: "Dr. H. Bambang Setiawan",
    overallScore: 87,
    status: "Very Good",
    topArea: "Professional Impact",
    productivity: "126%",
    discipline: "88%",
    ptpProgress: 84,
    habits: [
      { name: "Shalat Berjamaah di Awal Waktu", target: "5x/hari", completion: 88 },
      { name: "Review Efisiensi Logistik Berkelanjutan", target: "1x/minggu", completion: 90 },
      { name: "Diskusi Bebas Stres dengan Tim", target: "2x/minggu", completion: 78 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 58, after: 88 },
      { area: "Personal Development", before: 55, after: 84 },
      { area: "Leadership Excellence", before: 52, after: 86 },
      { area: "Relationship & Community", before: 58, after: 82 },
      { area: "Professional Impact", before: 65, after: 94 },
    ],
    coachComment:
      "Perkembangan pesat pada kontrol emosi dan pengelolaan stres kerja di lingkungan logistik yang dinamis.",
    safarComment:
      "Disiplin mengisi habit tracker dan selalu hadir dalam pertemuan bulanan.",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    role: "Finance Director",
    company: "PT Astra International Tbk",
    coach: "Ustz. Hj. Nurjanah, M.Ag.",
    overallScore: 92,
    status: "Excellent",
    topArea: "Relationship & Community",
    productivity: "124%",
    discipline: "95%",
    ptpProgress: 90,
    habits: [
      { name: "Dhuha 4 Rakaat & Doa Kelapangan Rezeki", target: "7x/minggu", completion: 96 },
      { name: "Program CSR & Bina Komunitas Usaha", target: "1x/bulan", completion: 90 },
      { name: "Waktu Khusus Keluarga (No Gadget)", target: "2x/minggu", completion: 85 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 62, after: 92 },
      { area: "Personal Development", before: 60, after: 88 },
      { area: "Leadership Excellence", before: 58, after: 90 },
      { area: "Relationship & Community", before: 64, after: 96 },
      { area: "Professional Impact", before: 72, after: 94 },
    ],
    coachComment:
      "Dewi berhasil menyeimbangkan kepemimpinan keuangan yang tegas dengan ketenangan batin dan kepedulian sosial.",
    safarComment:
      "Inisiatif tinggi dalam mengorganisir kegiatan sosial bersama Sahabat Safar.",
  },
  {
    id: "5",
    name: "Rizky Pratama",
    role: "IT & Digital Transformation Lead",
    company: "PT Astra International Tbk",
    coach: "Ust. Ahmad Rifai, M.Pd.",
    overallScore: 89,
    status: "Excellent",
    topArea: "Personal Development",
    productivity: "135%",
    discipline: "91%",
    ptpProgress: 86,
    habits: [
      { name: "Dzikir Pagi-Petang & Tilawah 15 Mnt", target: "7x/minggu", completion: 90 },
      { name: "Digital Detoks Setelah Jam 9 Malam", target: "7x/minggu", completion: 82 },
      { name: "Sharing Knowledge Tech & Leadership", target: "2x/bulan", completion: 88 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 56, after: 88 },
      { area: "Personal Development", before: 58, after: 92 },
      { area: "Leadership Excellence", before: 54, after: 86 },
      { area: "Relationship & Community", before: 55, after: 84 },
      { area: "Professional Impact", before: 68, after: 95 },
    ],
    coachComment:
      "Perubahan positif pada konsentrasi dan kejernihan pikiran dalam mengambil keputusan arsitektur sistem.",
    safarComment:
      "Sangat terbantu dengan reminder otomatis sistem dan rajin berbagi insight digital.",
  },
];

// Area Growth Rankings for Horizontal Bar Chart (Sorted Highest First)
const AREA_GROWTH_RANKED = [
  { area: "Leadership Excellence", before: 55, after: 91, delta: 36 },
  { area: "Spiritual Growth", before: 62, after: 94, delta: 32 },
  { area: "Personal Development", before: 58, after: 88, delta: 30 },
  { area: "Professional Impact", before: 64, after: 92, delta: 28 },
  { area: "Relationship & Community", before: 60, after: 86, delta: 26 },
];

export default function AdminImpactReportPage() {
  const [viewMode, setViewMode] = useState<"group" | "individual">("group");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("1");

  const currentParticipant =
    MOCK_PARTICIPANTS.find((p) => p.id === selectedParticipantId) || MOCK_PARTICIPANTS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      {/* ─── TOP BAR & MODE SWITCHER (HIDDEN IN PRINT) ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#C79A3C]" />
            <h1 className="text-2xl font-black text-[#0F1E3D] tracking-tight">
              BinaJourney Transformation Impact Report v2.0
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Laporan evaluasi dampak 90 hari berbasis data assessment, PTP, habit, &amp; evaluasi Kirkpatrick Level 1-4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode("group")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "group"
                  ? "bg-[#0F1E3D] text-amber-400 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Group Report</span>
            </button>
            <button
              onClick={() => setViewMode("individual")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "individual"
                  ? "bg-[#0F1E3D] text-amber-400 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Individual Report</span>
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C79A3C] hover:bg-[#b08732] text-[#0F1E3D] text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export Report to PDF
          </button>
        </div>
      </div>

      {/* ─── FILTERS BAR (HIDDEN IN PRINT) ─── */}
      <div className="bg-white border border-[#EAE5D9] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Perusahaan / Mitra
            </label>
            <select className="bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F1E3D] rounded-xl px-3 py-1.5 focus:border-[#C79A3C]">
              <option>PT Astra International Tbk</option>
              <option>PT Telekomunikasi Indonesia Tbk</option>
              <option>PT Bank Syariah Indonesia Tbk</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Batch Keberangkatan
            </label>
            <select className="bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F1E3D] rounded-xl px-3 py-1.5 focus:border-[#C79A3C]">
              <option>Batch 1 — Executive Umrah (Spring 2026)</option>
              <option>Batch 2 — Leadership Journey (Winter 2025)</option>
            </select>
          </div>

          {viewMode === "individual" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pilih Peserta
              </label>
              <select
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                className="bg-amber-50/80 border border-amber-300 text-xs font-extrabold text-[#0F1E3D] rounded-xl px-3 py-1.5 focus:border-[#C79A3C]"
              >
                {MOCK_PARTICIPANTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="h-4 w-4" />
          <span>Verified Data (25 Peserta Complete)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: ORGANIZATION TRANSFORMATION REPORT (GROUP LEVEL)           */}
      {/* ========================================================================= */}
      {viewMode === "group" && (
        <div id="print-area-group" className="space-y-8 print:space-y-6">
          {/* SECTION 1: GROUP HERO EXECUTIVE DASHBOARD */}
          <div className="bg-[#0F1E3D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-navy-900 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-extrabold uppercase text-amber-400 tracking-widest block mb-4">
              <span>ORGANIZATION TRANSFORMATION REPORT &mdash; 90-DAY FINAL EVALUATION</span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full">
                PT Astra International Tbk (25 Peserta)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Overall Score & Investment Summary */}
              <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-blue-900/80 pb-6 lg:pb-0 lg:pr-8">
                <div>
                  <span className="text-xs text-blue-200 font-semibold block">Skor Transformasi Organisasi</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                      88.4<span className="text-xl text-blue-200 font-bold">/100</span>
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold">
                      Kategori: High Impact
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-900/60">
                  <div className="text-blue-200 text-xs py-0.5 flex items-center gap-2">
                    <span className="h-3 w-0.5 bg-amber-400 rounded-full" />
                    <span>Investasi Program: <strong className="text-white">Rp 350.000.000</strong></span>
                  </div>
                  <div className="text-blue-200 text-xs py-0.5 flex items-center gap-2">
                    <span className="h-3 w-0.5 bg-emerald-400 rounded-full" />
                    <span>Estimasi Benefit Efisiensi: <strong className="text-emerald-400">Rp 970.000.000</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 KPI Cards Bahasa Direksi */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-blue-200 font-bold uppercase block">TOTAL ROI</span>
                  <div className="text-2xl font-black text-amber-400">177%</div>
                  <span className="text-[11px] text-blue-300 font-medium block">Return on Investment</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-blue-200 font-bold uppercase block">NET BENEFIT</span>
                  <div className="text-lg font-black text-emerald-400 mt-1">Rp 620M</div>
                  <span className="text-[11px] text-blue-300 font-medium block">Keuntungan Bersih</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-blue-200 font-bold uppercase block">PAYBACK PERIOD</span>
                  <div className="text-2xl font-black text-amber-300">4.2 Bln</div>
                  <span className="text-[11px] text-blue-300 font-medium block">Modal Kembali</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs text-blue-200 font-bold uppercase block">PTP COMPLETION</span>
                  <div className="text-2xl font-black text-emerald-400">92%</div>
                  <span className="text-[11px] text-blue-300 font-medium block">Target Tercapai</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 & 3: RADAR CHART (BEFORE VS AFTER) & AVERAGE GROWTH BAR (SORTED) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SECTION 2: RADAR CHART 5 AREA TRANSFORMASI */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  RADAR TRANSFORMASI ORGANISASI
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                  Before vs After (5 Area Transformasi)
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan rata-rata baseline (sebelum berangkat) vs evaluasi akhir 90 hari.
                </p>
              </div>

              <div className="pt-2">
                <TransformationRadarChart />
              </div>
            </div>

            {/* SECTION 3: AVERAGE GROWTH BY AREA (HORIZONTAL BAR CHART SORTED HIGHEST FIRST) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-[#EAE5D9] pb-3">
                  <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                    TRANSFORMATION DELTA RANKING
                  </span>
                  <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                    Average Growth by Area (Diurutkan dari Tertinggi)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Area transformasi dengan lonjakan pertumbuhan paling signifikan pada peserta.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  {AREA_GROWTH_RANKED.map((item, index) => (
                    <div key={item.area} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#0F1E3D] flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                            #{index + 1}
                          </span>
                          {item.area}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-semibold">{item.before}% &rarr; {item.after}%</span>
                          <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            +{item.delta}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-slate-400 transition-all"
                          style={{ width: `${item.before}%` }}
                        />
                        <div
                          className="h-full bg-[#C79A3C] transition-all"
                          style={{ width: `${item.delta}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5 mt-4">
                <Lightbulb className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="font-medium">
                  <strong>Insight Utama:</strong> Leadership Excellence dan Spiritual Growth mengalami lonjakan tertinggi (+36% &amp; +32%), mengonfirmasi keberhasilan integrasi ibadah dengan gaya kepemimpinan.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4 & 5: READINESS INDEX & PTP COMPLETION DONUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SECTION 4: TRANSFORMATION READINESS INDEX */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  KEBERLANJUTAN BUDAYA
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                  Transformation Readiness Index
                </h3>
                <p className="text-xs text-slate-500">
                  Tingkat kesiapan organisasi menjaga budaya transformasi pasca 90 hari.
                </p>
              </div>

              <div className="text-center py-4 space-y-3">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-50 border-4 border-[#C79A3C]/30 shadow-inner">
                  <div className="text-center">
                    <span className="text-4xl font-black text-[#0F1E3D]">89%</span>
                    <span className="text-[10px] font-extrabold text-[#C79A3C] uppercase block tracking-widest">High Readiness</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
                  89% alumni siap menjadi <em>Change Champion</em> untuk menyebarkan budaya kepemimpinan di unit kerja masing-masing.
                </p>
              </div>
            </div>

            {/* SECTION 5: PTP COMPLETION DONUT CHART */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  CUMULATIVE PROGRESS
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                  PTP Completion Rate (3 Kategori Status)
                </h3>
                <p className="text-xs text-slate-500">
                  Proporsi penyelesaian Personal Transformation Project dari 25 peserta.
                </p>
              </div>

              <div className="pt-2">
                <DonutChart />
              </div>
            </div>
          </div>

          {/* SECTION 6: KIRKPATRICK DASHBOARD (4 SCORE CARDS LEVEL 1-4) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-5">
            <div className="border-b border-[#EAE5D9] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  STANDAR EVALUASI GLOBAL
                </span>
                <h3 className="text-lg font-bold text-[#0F1E3D]">
                  Kirkpatrick Evaluation Dashboard (Level 1 &ndash; 4)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#0F1E3D] bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl">
                Integrated Framework
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Level 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    LEVEL 1
                  </span>
                  <Award className="h-4 w-4 text-[#C79A3C]" />
                </div>
                <h4 className="font-extrabold text-[#0F1E3D] text-sm">Reaction &amp; Experience</h4>
                <div className="text-2xl font-black text-[#0F1E3D]">94%</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Kepuasan peserta terhadap kualitas materi, pembinaan coach, dan aplikasi digital.
                </p>
              </div>

              {/* Level 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    LEVEL 2
                  </span>
                  <BookOpen className="h-4 w-4 text-[#C79A3C]" />
                </div>
                <h4 className="font-extrabold text-[#0F1E3D] text-sm">Learning &amp; Awareness</h4>
                <div className="text-2xl font-black text-[#0F1E3D]">89%</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Peningkatan pemahaman nilai kepemimpinan, amanah, dan kesadaran spiritual.
                </p>
              </div>

              {/* Level 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    LEVEL 3
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-[#C79A3C]" />
                </div>
                <h4 className="font-extrabold text-[#0F1E3D] text-sm">Behavior &amp; Habit</h4>
                <div className="text-2xl font-black text-[#0F1E3D]">86%</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Konsistensi pelaksanaan habit rutin harian/pekanan di rumah dan tempat kerja.
                </p>
              </div>

              {/* Level 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    LEVEL 4
                  </span>
                  <TrendingUp className="h-4 w-4 text-[#C79A3C]" />
                </div>
                <h4 className="font-extrabold text-[#0F1E3D] text-sm">Business Results</h4>
                <div className="text-2xl font-black text-[#0F1E3D]">92%</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Pencapaian KPI bisnis, disiplin kerja, efisiensi operasional, &amp; budaya tim.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 7: BUSINESS IMPACT KPI CARDS (BAHASA DIREKSI) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-5">
            <div className="border-b border-[#EAE5D9] pb-3">
              <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                BAHASA DIREKSI (EXECUTIVE METRICS)
              </span>
              <h3 className="text-lg font-bold text-[#0F1E3D]">
                Business Impact Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Peningkatan Quality Index</span>
                <div className="text-3xl font-black text-[#0F1E3D]">94%</div>
                <span className="text-[11px] font-semibold text-emerald-600">+12% dibanding baseline</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Pencapaian KPI Tim</span>
                <div className="text-3xl font-black text-[#0F1E3D]">128%</div>
                <span className="text-[11px] font-semibold text-emerald-600">Melampaui target tahunan</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Peningkatan Produktivitas</span>
                <div className="text-3xl font-black text-[#0F1E3D]">96%</div>
                <span className="text-[11px] font-semibold text-emerald-600">Turnover mendekati 0%</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Efisiensi Biaya</span>
                <div className="text-3xl font-black text-[#0F1E3D]">92%</div>
                <span className="text-[11px] font-semibold text-emerald-600">Komunikasi antar-divisi lancar</span>
              </div>
            </div>
          </div>

          {/* SECTION 8: TOP PERFORMERS & TRANSFORMATION STORIES */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-5">
            <div className="border-b border-[#EAE5D9] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  ALUMNI BERPRESTASI &amp; KISAH SUKSES
                </span>
                <h3 className="text-lg font-bold text-[#0F1E3D]">
                  Top Performers &amp; Transformation Stories
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-xl">
                5 Peserta Terbaik (Skor &gt; 85)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PARTICIPANTS.map((p, idx) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-full bg-[#0F1E3D] text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-[#0F1E3D] text-sm leading-snug">{p.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium block">{p.role}</span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-black text-xs bg-emerald-100 px-2 py-0.5 rounded-md">
                      {p.overallScore}/100
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 italic">
                    &ldquo;{p.coachComment}&rdquo;
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-slate-200/60">
                    <span>Produktivitas: <strong className="text-[#0F1E3D]">{p.productivity}</strong></span>
                    <span>Konsistensi: <strong className="text-[#0F1E3D]">{p.discipline}</strong></span>
                    <span className="text-emerald-600 font-black">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 9: MANAGEMENT RECOMMENDATIONS (TIDAK DIUKUR, REKOMENDASI OTOMATIS) */}
          <div className="bg-amber-50/40 rounded-3xl p-6 border border-amber-200 shadow-xs space-y-5">
            <div className="border-b border-amber-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-widest block">
                  ACTIONABLE NEXT STEPS FOR MANAGEMENT
                </span>
                <h3 className="text-lg font-bold text-[#0F1E3D]">
                  Management Recommendations
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-xl">
                Rekomendasi Berbasis Sistem
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <UserCheck className="h-4 w-4 text-[#C79A3C]" />
                  <span>1. Coaching Lanjutan Periodic</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Menjadwalkan sesi coaching 1-on-1 berkala tiap 3 bulan untuk menjaga ritme istiqamah alumni.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-[#C79A3C]" />
                  <span>2. Penugasan Change Champion</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Menunjuk 5 lulusan terbaik (skor &gt;90) sebagai perintis budaya di divisi masing-masing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Building2 className="h-4 w-4 text-[#C79A3C]" />
                  <span>3. Culture Reinforcement</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Mendorong ritual Shalat Berjamaah tepat waktu dan sesi sharing mingguan di level unit kerja.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Users className="h-4 w-4 text-[#C79A3C]" />
                  <span>4. Superior 90-Day Monitoring</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Atasan langsung memantau ketercapaian target PTP dalam penilaian kinerja semesteran.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Zap className="h-4 w-4 text-[#C79A3C]" />
                  <span>5. Refreshment Program</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Mengadakan Re-union Gathering &amp; Refreshment Session pada bulan ke-6 pasca umrah.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: INDIVIDUAL TRANSFORMATION REPORT (PARTICIPANT LEVEL)        */}
      {/* ========================================================================= */}
      {viewMode === "individual" && (
        <div id="print-area-individual" className="space-y-8 print:space-y-6">
          {/* SECTION 1: INDIVIDUAL COVER & IDENTITY HERO */}
          <div className="bg-[#0F1E3D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-navy-900 relative overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-amber-400 tracking-widest block mb-4">
              <span>INDIVIDUAL TRANSFORMATION REPORT &mdash; 90 DAYS</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full">
                Status: {currentParticipant.status}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-3">
                <span className="text-xs text-blue-200 font-semibold block">{currentParticipant.company}</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {currentParticipant.name}
                </h2>
                <p className="text-sm text-amber-300 font-bold">{currentParticipant.role}</p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-amber-400" /> Coach: {currentParticipant.coach}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-amber-400" /> Sahabat Safar Assigned
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/10 p-5 rounded-2xl border border-white/10 text-center space-y-2">
                <span className="text-xs text-blue-200 font-bold uppercase tracking-wider block">Skor Transformasi Akhir</span>
                <div className="text-4xl font-black text-amber-400">{currentParticipant.overallScore}/100</div>
                <span className="text-xs text-emerald-300 font-semibold block">Top Growth: {currentParticipant.topArea}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2 & 3: INDIVIDUAL RADAR CHART & DELTA BAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  RADAR TRANSFORMASI INDIVIDU
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                  Before vs After ({currentParticipant.name})
                </h3>
              </div>
              <TransformationRadarChart data={currentParticipant.radarData} />
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  PERTUMBUHAN AREA
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">
                  Transformation Delta (Urut dari Tertinggi)
                </h3>
              </div>

              <div className="space-y-4 pt-2">
                {currentParticipant.radarData
                  .map((item) => ({ ...item, delta: item.after - item.before }))
                  .sort((a, b) => b.delta - a.delta)
                  .map((item, idx) => (
                    <div key={item.area} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#0F1E3D]">{item.area}</span>
                        <span className="text-emerald-600 font-black">+{item.delta}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-slate-400" style={{ width: `${item.before}%` }} />
                        <div className="h-full bg-[#C79A3C]" style={{ width: `${item.delta}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* SECTION 6 & 7: PTP & HABIT PROGRESS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  PERSONAL TRANSFORMATION PROJECT
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">PTP Progress</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Pencapaian Milestone 90 Hari</span>
                  <span className="text-[#0F1E3D] font-black">{currentParticipant.ptpProgress}% Completed</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C79A3C]" style={{ width: `${currentParticipant.ptpProgress}%` }} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal pt-2">
                  Proyek transformasi personal telah dilaksanakan sesuai kesepakatan dengan Coach dan disetujui oleh Atasan Langsung.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EAE5D9] shadow-xs space-y-4">
              <div className="border-b border-[#EAE5D9] pb-3">
                <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                  MONITORING KEBIASAAN
                </span>
                <h3 className="text-base font-bold text-[#0F1E3D] mt-0.5">Habit Progress</h3>
              </div>

              <div className="space-y-3">
                {currentParticipant.habits.map((h, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#0F1E3D]">{h.name} ({h.target})</span>
                      <span className="text-amber-700">{h.completion}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${h.completion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 8: COACH & SAHABAT SAFAR FEEDBACK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-white border border-[#EAE5D9] shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                INSIGHT COACH PERSONAL
              </span>
              <h4 className="font-bold text-[#0F1E3D] text-sm">{currentParticipant.coach}</h4>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                &ldquo;{currentParticipant.coachComment}&rdquo;
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#EAE5D9] shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#C79A3C] tracking-widest block">
                CATATAN SAHABAT SAFAR
              </span>
              <h4 className="font-bold text-[#0F1E3D] text-sm">Peer Accountability Partner</h4>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                &ldquo;{currentParticipant.safarComment}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
