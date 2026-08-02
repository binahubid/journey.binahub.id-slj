"use client";

import { useState } from "react";
import { Award, BookOpen, Building2, CheckCircle2, ChevronRight, Heart, Lightbulb, Search, Sparkles, TrendingUp, User, UserCheck, Users, X, Zap } from "lucide-react";
import { TransformationRadarChart } from "@/components/domain/TransformationRadarChart";
import { DonutChart } from "@/components/domain/DonutChart";
import { getTransformationAreaColor } from "@/lib/transformation-areas";
import { ALL_25_PARTICIPANTS, DEMO_AREA_GROWTH, DEMO_PARTICIPANTS } from "@/data/demo-impact-report";

export function DemoImpactReport() {
  const [viewMode, setViewMode] = useState<"group" | "individual">("group");
  const [selectedId, setSelectedId] = useState(DEMO_PARTICIPANTS[0].id);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const participant = DEMO_PARTICIPANTS.find((p) => p.id === selectedId) || DEMO_PARTICIPANTS[0];

  const filteredParticipants = ALL_25_PARTICIPANTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topArea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-7">
      <div className="border-l-2 border-[#C79A3C] bg-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-[0_1px_2px_rgba(15,30,61,0.04)]">
        <div>
          <p className="text-xs font-extrabold text-[#0F1E3D]">Demo Report <span className="ml-2 font-medium text-[#C79A3C]">Presentation dataset</span></p>
          <p className="text-[11px] text-slate-500">Data simulasi untuk presentasi dan acuan struktur laporan masa depan. Bukan data peserta aktual.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button onClick={() => setViewMode("group")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewMode === "group" ? "bg-[#0F1E3D] text-amber-400" : "text-slate-600"}`}><Building2 className="mr-1 inline h-3.5 w-3.5" />Group Report</button>
          <button onClick={() => setViewMode("individual")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewMode === "individual" ? "bg-[#0F1E3D] text-amber-400" : "text-slate-600"}`}><User className="mr-1 inline h-3.5 w-3.5" />Individual Report</button>
        </div>
      </div>

      {viewMode === "group" ? (
        <div className="space-y-7">
          <section className="relative overflow-hidden rounded-xl border border-[#17315C] bg-[#0B172E] p-6 text-white shadow-[0_18px_50px_-30px_rgba(15,30,61,0.65)] sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/5" />
            <div className="pointer-events-none absolute -right-4 -top-12 h-40 w-40 rounded-full border border-[#C79A3C]/15" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              <span className="text-amber-500 font-extrabold tracking-wider">ORGANIZATION TRANSFORMATION REPORT — 90-DAY FINAL EVALUATION</span>
              <span className="rounded-full border border-amber-500/60 bg-amber-500/10 px-3.5 py-1 text-amber-400 font-extrabold tracking-wider text-[11px]">
                PT ASTRA INTERNATIONAL TBK (25 PESERTA)
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-12 items-stretch">
              <div className="space-y-4 border-slate-700/60 lg:col-span-4 lg:border-r lg:pr-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Skor Transformasi Organisasi</p>
                  <div className="mt-2 flex items-center gap-3">
                    <strong className="text-5xl font-black tabular-nums text-amber-400">
                      88.4<span className="text-xl font-bold text-slate-300">/100</span>
                    </strong>
                    <span className="rounded-full border border-emerald-500/40 bg-[#063326] px-3 py-1 text-xs font-bold text-emerald-400">
                      Kategori: High Impact
                    </span>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-700/60 pt-3 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-0.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Investasi Program: <strong className="font-bold text-white">Rp 350.000.000</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-0.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Estimasi Benefit Efisiensi: <strong className="font-bold text-emerald-400">Rp 970.000.000</strong></span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-8">
                {[
                  ["TOTAL ROI", "177%", "text-amber-400", "Return on Investment"],
                  ["NET BENEFIT", "Rp 620M", "text-emerald-400", "Keuntungan Bersih"],
                  ["PAYBACK PERIOD", "4.2 Bln", "text-white", "Modal Kembali"],
                  ["PTP COMPLETION", "92%", "text-emerald-400", "Target Tercapai"],
                ].map(([label, value, valColor, sub]) => (
                  <div
                    key={label}
                    className="flex flex-col justify-between items-center rounded-2xl border border-slate-700/60 bg-[#0D213A]/90 p-4 text-center shadow-inner min-h-[105px]"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                      {label}
                    </span>
                    <p className={`my-1 text-2xl font-black tabular-nums sm:text-3xl ${valColor}`}>
                      {value}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400">
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Card 1: Radar Transformasi Organisasi */}
            <section className="flex flex-col justify-between rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                    RADAR TRANSFORMASI ORGANISASI
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                    Before vs After (5 Area Transformasi)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-normal">
                    Perbandingan rata-rata baseline (sebelum berangkat) vs evaluasi akhir 90 hari.
                  </p>
                </div>
                <div className="mt-4">
                  <TransformationRadarChart />
                </div>
              </div>
            </section>

            {/* Card 2: Transformation Delta Ranking */}
            <section className="flex flex-col justify-between rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                    TRANSFORMATION DELTA RANKING
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                    Average Growth by Area (Diurutkan dari Tertinggi)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-normal">
                    Area transformasi dengan lonjakan pertumbuhan paling signifikan pada peserta.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  {DEMO_AREA_GROWTH.map((item, index) => {
                    const badgeBg = [
                      "bg-indigo-700",
                      "bg-amber-600",
                      "bg-blue-600",
                      "bg-purple-700",
                      "bg-rose-600",
                    ][index % 5];

                    const barColor = [
                      "bg-indigo-600",
                      "bg-amber-500",
                      "bg-blue-600",
                      "bg-purple-600",
                      "bg-rose-600",
                    ][index % 5];

                    return (
                      <div key={item.area} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center">
                            <span className={`mr-2 inline-flex h-5 w-7 items-center justify-center rounded-full text-[10px] font-black text-white ${badgeBg}`}>
                              #{index + 1}
                            </span>
                            <span className="font-extrabold text-slate-900">{item.area}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">
                              {item.before}% → {item.after}%
                            </span>
                            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-600">
                              +{item.delta}%
                            </span>
                          </div>
                        </div>
                        <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-slate-300/80"
                            style={{ width: `${item.before}%` }}
                          />
                          <div
                            className={`${barColor}`}
                            style={{ width: `${item.delta}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-slate-700">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong className="font-bold text-slate-900">Insight Utama:</strong>{" "}
                  Leadership Excellence dan Spiritual Growth mengalami lonjakan tertinggi (
                  <strong className="text-amber-700 font-bold">+36% & +32%</strong>
                  ), mengonfirmasi keberhasilan integrasi ibadah dengan gaya kepemimpinan.
                </span>
              </div>
            </section>
          </div>

          {/* SECTION 2: TRANSFORMATION READINESS & CUMULATIVE PROGRESS */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Card 1: Transformation Readiness Index */}
            <section className="flex flex-col justify-between rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)] lg:col-span-5">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                    KEBERLANJUTAN BUDAYA
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                    Transformation Readiness Index
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-normal">
                    Tingkat kesiapan organisasi menjaga budaya transformasi pasca 90 hari.
                  </p>
                </div>
                <div className="my-6 flex flex-col items-center justify-center text-center">
                  <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border-[6px] border-amber-300/80 bg-amber-50/50 shadow-xs">
                    <div>
                      <strong className="text-4xl font-black text-[#0F1E3D]">89%</strong>
                      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#C79A3C] mt-0.5">
                        HIGH READINESS
                      </span>
                    </div>
                  </div>
                  <p className="mt-5 text-xs font-medium text-slate-600 max-w-xs leading-relaxed">
                    89% alumni siap menjadi <em className="not-italic font-semibold text-slate-800">Change Champion</em> untuk menyebarkan budaya kepemimpinan di unit kerja masing-masing.
                  </p>
                </div>
              </div>
            </section>

            {/* Card 2: Cumulative Progress - PTP Completion Rate */}
            <section className="flex flex-col justify-between rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)] lg:col-span-7">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                    CUMULATIVE PROGRESS
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                    PTP Completion Rate (3 Kategori Status)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-normal">
                    Proporsi penyelesaian Personal Transformation Project dari 25 peserta.
                  </p>
                </div>
                <div className="mt-4">
                  <DonutChart />
                </div>
              </div>
            </section>
          </div>

          {/* SECTION 3: KIRKPATRICK EVALUATION DASHBOARD */}
          <section className="rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                  STANDAR EVALUASI GLOBAL
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                  Kirkpatrick Evaluation Dashboard (Level 1 – 4)
                </h3>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-900 w-fit">
                Integrated Framework
              </span>
            </div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Level 1", "Reaction & Experience", "94%", Award],
                ["Level 2", "Learning & Awareness", "89%", BookOpen],
                ["Level 3", "Behavior & Habit", "86%", CheckCircle2],
                ["Level 4", "Business Results", "92%", TrendingUp],
              ].map(([level, title, score, Icon]: any) => (
                <div key={level} className="bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C79A3C]">{level}</span>
                      <Icon className="h-4 w-4 text-amber-500/80" />
                    </div>
                    <h4 className="mt-3 text-sm font-extrabold text-[#0F1E3D]">{title}</h4>
                  </div>
                  <p className="mt-2 text-2xl font-black tabular-nums text-[#0F1E3D]">{score}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: BUSINESS IMPACT SUMMARY */}
          <section className="rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                BAHASA DIREKSI (EXECUTIVE METRICS)
              </p>
              <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                Business Impact Summary
              </h3>
            </div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["PENINGKATAN QUALITY INDEX", "94%", "+12% dibanding baseline"],
                ["PENCAPAIAN KPI TIM", "128%", "Melampaui target tahunan"],
                ["PENINGKATAN PRODUKTIVITAS", "96%", "Turnover mendekati 0%"],
                ["EFISIENSI BIAYA", "92%", "Komunikasi antar-divisi lancar"],
              ].map(([label, value, note]) => (
                <div key={label} className="bg-white p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-[#0F1E3D]">{value}</p>
                  </div>
                  <span className="mt-2 block text-xs font-semibold text-emerald-600">{note}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: TOP PERFORMERS */}
          <section className="rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                  ALUMNI BERPRESTASI & KISAH SUKSES
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                  Top Performers (Evaluasi Akhir 90 Hari)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-800 shrink-0">
                  High Consistency
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C79A3C]/40 bg-amber-50 px-3 py-1 text-xs font-extrabold text-[#0F1E3D] hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Lihat Selengkapnya ({ALL_25_PARTICIPANTS.length} Peserta)
                  <ChevronRight className="h-3.5 w-3.5 text-[#C79A3C]" />
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_PARTICIPANTS.slice(0, 6).map((p, idx) => (
                <div key={p.id} className="bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F1E3D] text-xs font-black text-amber-400 border border-amber-400/30 shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <strong className="block text-sm font-extrabold text-[#0F1E3D] leading-tight">
                            {p.name}
                          </strong>
                          <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                            {p.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {p.overallScore}
                        </span>
                      </div>
                    </div>
                    <p className="my-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs italic text-slate-700 leading-relaxed">
                      “{p.coachComment}”
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-slate-700">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Produktivitas <strong className="text-[#0F1E3D]">{p.productivity}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Konsistensi <strong className="text-[#0F1E3D]">{p.discipline}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#C79A3C] hover:text-[#0F1E3D] transition-colors cursor-pointer"
              >
                Lihat Seluruh Peringkat Peserta (25 Alumni)
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* SECTION 6: MANAGEMENT RECOMMENDATIONS */}
          <section className="rounded-lg border border-[#EAE5D9] bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,30,61,0.45)]">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">
                ACTIONABLE NEXT STEPS
              </p>
              <h3 className="mt-0.5 text-base font-extrabold text-[#0F1E3D]">
                Management Recommendations
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 font-normal">
                Rekomendasi strategis untuk direksi & manajemen dalam menjaga kesinambungan budaya transformasi.
              </p>
            </div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [UserCheck, "Coaching Lanjutan Periodic", "Sesi coaching berkala tiap 3 bulan untuk menjaga ritme istiqamah alumni.", "Prioritas Tinggi"],
                [Sparkles, "Penugasan Change Champion", "Menunjuk lulusan terbaik sebagai perintis budaya di divisinya.", "Eksekusi Segera"],
                [Building2, "Culture Reinforcement", "Mendorong ritual dan sharing nilai secara rutin di unit kerja.", "Program Berkelanjutan"],
                [Users, "Superior 90-Day Monitoring", "Atasan langsung memantau target PTP dalam evaluasi kinerja.", "Sistem Integrasi"],
                [Zap, "Refreshment Program", "Mengadakan gathering dan refreshment pada bulan keenam.", "Agenda 6-Bulan"],
              ].map(([Icon, title, body, tag]: any) => (
                <div key={title} className="bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                      <Icon className="h-4 w-4 text-[#C79A3C] shrink-0" />
                      <h4 className="text-xs font-extrabold text-[#0F1E3D]">
                        {title}
                      </h4>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 font-normal leading-relaxed">
                      {body}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                      {tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-7">
          <div className="print:hidden"><label className="text-[10px] font-bold uppercase text-slate-500">Pilih Peserta</label><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="ml-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold">{DEMO_PARTICIPANTS.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}</select></div>
          <section className="rounded-3xl bg-[#0F1E3D] p-6 text-white sm:p-8"><div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest text-amber-400"><span>Individual Transformation Report — 90 Days</span><span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-emerald-300">{participant.status}</span></div><div className="mt-6 grid gap-6 lg:grid-cols-12"><div className="lg:col-span-7"><p className="text-xs text-blue-200">{participant.company}</p><h2 className="mt-2 text-4xl font-black">{participant.name}</h2><p className="mt-1 font-bold text-amber-300">{participant.role}</p><p className="mt-4 text-xs text-slate-300"><User className="mr-1 inline h-3.5 w-3.5" />Coach: {participant.coach} <Heart className="ml-4 mr-1 inline h-3.5 w-3.5 text-amber-400" />Sahabat Safar Assigned</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center lg:col-span-5"><p className="text-xs font-bold uppercase text-blue-200">Skor Transformasi Akhir</p><strong className="mt-2 block text-4xl text-amber-400">{participant.overallScore}/100</strong><span className="text-xs text-emerald-300">Top Growth: {participant.topArea}</span></div></div></section>
          <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-[#EAE5D9] bg-white p-6"><h3 className="font-bold text-[#0F1E3D]">Before vs After</h3><TransformationRadarChart data={participant.radarData} /></section><section className="rounded-3xl border border-[#EAE5D9] bg-white p-6"><h3 className="font-bold text-[#0F1E3D]">Transformation Delta</h3><div className="mt-5 space-y-4">{participant.radarData.map((item) => ({ ...item, delta: item.after - item.before })).sort((a, b) => b.delta - a.delta).map((item) => <div key={item.area}><div className="flex justify-between text-xs font-bold"><span>{item.area}</span><span className="text-emerald-600">+{item.delta}%</span></div><div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="bg-slate-400" style={{ width: `${item.before}%` }} /><div style={{ width: `${item.delta}%`, backgroundColor: getTransformationAreaColor(item.area) }} /></div></div>)}</div></section></div>
          <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-[#EAE5D9] bg-white p-6"><h3 className="font-bold text-[#0F1E3D]">PTP Progress</h3><div className="mt-5 flex justify-between text-xs font-bold"><span>Milestone 90 Hari</span><span>{participant.ptpProgress}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#C79A3C]" style={{ width: `${participant.ptpProgress}%` }} /></div></section><section className="rounded-3xl border border-[#EAE5D9] bg-white p-6"><h3 className="font-bold text-[#0F1E3D]">Habit Progress</h3><div className="mt-5 space-y-3">{participant.habits.map((h) => <div key={h.name}><div className="flex justify-between text-xs font-bold"><span>{h.name} ({h.target})</span><span>{h.completion}%</span></div><div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${h.completion}%` }} /></div></div>)}</div></section></div>
          <div className="grid gap-6 md:grid-cols-2"><section className="rounded-3xl border border-[#EAE5D9] bg-white p-5"><p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">Insight Coach Personal</p><h4 className="mt-2 text-sm font-bold">{participant.coach}</h4><p className="mt-2 text-xs italic text-slate-600">“{participant.coachComment}”</p></section><section className="rounded-3xl border border-[#EAE5D9] bg-white p-5"><p className="text-[10px] font-extrabold uppercase tracking-widest text-[#C79A3C]">Catatan Sahabat Safar</p><h4 className="mt-2 text-sm font-bold">Peer Accountability Partner</h4><p className="mt-2 text-xs italic text-slate-600">“{participant.safarComment}”</p></section></div>
        </div>
      )}

      {/* MODAL DAFTAR 25 PESERTA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                    Evaluasi Komprehensif
                  </span>
                  <span className="text-xs font-bold text-slate-400">Total {ALL_25_PARTICIPANTS.length} Peserta</span>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-[#0F1E3D]">
                  Daftar Peringkat & Transkrip Peserta 90 Hari
                </h3>
                <p className="text-xs text-slate-500">
                  PT Astra International Tbk — Program Leadership & Transformation
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery("");
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Search */}
            <div className="my-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama peserta, jabatan, atau area transformasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Content Table / List */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-2.5">
                {filteredParticipants.map((p) => {
                  const statusColor =
                    p.status === "Excellent"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : p.status === "Very Good"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200";

                  return (
                    <div
                      key={p.rank}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-amber-300 hover:shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F1E3D] text-xs font-black text-amber-400 shrink-0">
                          #{p.rank}
                        </span>
                        <div>
                          <strong className="text-xs font-extrabold text-[#0F1E3D]">
                            {p.name}
                          </strong>
                          <span className="block text-[11px] font-medium text-slate-500">
                            {p.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="rounded-md border bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                          Top: {p.topArea}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">PTP Progress</span>
                          <span className="font-extrabold text-slate-800">{p.ptpProgress}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">Produktivitas</span>
                          <span className="font-extrabold text-slate-800">{p.productivity}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-black ${statusColor}`}>
                            {p.overallScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredParticipants.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Tidak ditemukan peserta dengan kata kunci &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] font-medium text-slate-400">
                Menampilkan {filteredParticipants.length} dari {ALL_25_PARTICIPANTS.length} peserta
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery("");
                }}
                className="rounded-lg bg-[#0F1E3D] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#17315C] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
