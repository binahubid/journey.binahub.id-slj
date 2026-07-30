"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Target,
  FileText,
  Users,
  Check,
  Lock,
  Compass,
  Award,
  Zap,
  Globe,
  Activity,
  Plus,
  X,
  GripVertical,
  Edit3,
} from "lucide-react";

export default function JourneySetupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Current Step: 1..8 = Steps 1 to 8
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [muhasabah, setMuhasabah] = useState("");
  const [niat, setNiat] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [mainTarget, setMainTarget] = useState("");
  const [indicators, setIndicators] = useState<string[]>(["", "", ""]);
  
  const [actionPlans, setActionPlans] = useState<{ id: string; title: string; frequency: string }[]>([]);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionFreq, setNewActionFreq] = useState("Setiap hari");

  const [sahabatSafar, setSahabatSafar] = useState("");
  const [sahabatRole, setSahabatRole] = useState("");

  // Commitment State
  const [isCommitted, setIsCommitted] = useState(false);
  const [committing, setCommitting] = useState(false);

  const totalSteps = 8;

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      router.replace("/journey");
    }
    loadUser();
  }, []);

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  const addActionPlan = () => {
    if (newActionTitle.trim()) {
      setActionPlans([
        ...actionPlans,
        { id: String(Date.now()), title: newActionTitle.trim(), frequency: newActionFreq },
      ]);
      setNewActionTitle("");
    }
  };

  const removeActionPlan = (id: string) => {
    setActionPlans(actionPlans.filter((a) => a.id !== id));
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;

      if (currentUserId) {
        // 1. Upsert Profile
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 90);

        await supabase.from("profiles").upsert({
          user_id: currentUserId,
          full_name: user?.user_metadata?.full_name || "Peserta SLJ",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          role: "participant",
        });

        // 1b. Ensure profile start_date is set to TODAY if not already
        const todayStr = new Date().toISOString().split("T")[0];
        await supabase
          .from("profiles")
          .update({ start_date: new Date().toISOString() })
          .eq("user_id", currentUserId)
          .is("start_date", null);

        // 2. Save Journey (ACTIVE + EDITABLE)
        const { data: journey } = await supabase.from("journeys").upsert({
          user_id: currentUserId,
          status: "ACTIVE",
          ptp_status: "EDITABLE",
          muhasabah,
          niat,
          area_transformasi: selectedAreas,
          main_target: mainTarget,
          success_indicators: indicators.filter((i) => i.trim() !== ""),
        }).select().maybeSingle();

        // 3. Save Action Plans & Habits
        if (journey) {
          for (const ap of actionPlans) {
            const { data: apData } = await supabase.from("action_plans").insert({
              journey_id: journey.id,
              user_id: currentUserId,
              title: ap.title,
              category: "general",
              frequency: ap.frequency,
            }).select().maybeSingle();

            await supabase.from("habits").insert({
              user_id: currentUserId,
              action_plan_id: apData?.id || null,
              title: ap.title,
              category: "general",
              frequency: ap.frequency,
              source: "action_plan",
              effective_from: todayStr,
              is_archived: false,
            });
          }

          // Save Initial PTP Snapshot
          await supabase.from("ptp_snapshots").insert({
            journey_id: journey.id,
            user_id: currentUserId,
            version: 1,
            trigger_type: "INITIAL",
            snapshot_data: {
              muhasabah,
              niat,
              area_transformasi: selectedAreas,
              main_target: mainTarget,
              success_indicators: indicators.filter((i) => i.trim() !== ""),
              action_plans: actionPlans,
            },
          });

          // 4. Save Support Team
          if (sahabatSafar) {
            await supabase.from("support_team").insert({
              journey_id: journey.id,
              user_id: currentUserId,
              sahabat_safar_name: sahabatSafar,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error saving journey to Supabase:", err);
    } finally {
      setCommitting(false);
      setIsCommitted(true);
    }
  };

  const areaOptions = [
    { id: "Spiritual Growth", icon: Compass, label: "Spiritual Growth", desc: "hubungan kita dengan Allah SWT" },
    { id: "Personal Development", icon: Zap, label: "Personal Development", desc: "hubungan kita dengan diri sendiri" },
    { id: "Leadership Excellence", icon: Award, label: "Leadership Excellence", desc: "amanah, tugas dan tanggung jawab kita dalam pekerjaan" },
    { id: "Relationship", icon: Users, label: "Relationship", desc: "hubungan kita dengan orang lain" },
    { id: "Community Impact", icon: Globe, label: "Community Impact", desc: "dampak terhadap lingkungan sekitar" },
  ];

  return (
    <div className="min-h-screen bg-warm-bg text-navy-900 font-sans flex flex-col justify-between p-4 md:p-8">
      {/* Container */}
      <div className="max-w-4xl w-full mx-auto my-auto space-y-6">
        {/* Step Card Header */}
        <Card className="bg-white border-warm-border p-6 md:p-8 rounded-2xl shadow-md space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-warm-border pb-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="inline-block">
                <img
                  src="/BinaJourney_logo.webp"
                  alt="BinaJourney Logo"
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-gray-500">Step {step} of {totalSteps}</span>
              {/* Step indicator dashes */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-5 rounded-full transition-colors ${
                      i + 1 <= step ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── STEP 1: MUHASABAH ─── */}
          {step === 1 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900">1. Muhasabah</h1>
                <p className="text-xs text-gray-600">
                  Apa hal terbesar yang ingin Anda perbaiki dan transformasikan selama 90 hari ke depan?
                </p>
              </div>

              {/* Prompt guide box */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 space-y-2 text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Apa yang paling mengganggu hidup Anda?</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Apa kebiasaan yang paling ingin diubah?</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Jika Allah memberi kesempatan berubah, apa yang ingin Anda ubah?</span>
                </div>
              </div>

              <Textarea
                value={muhasabah}
                onChange={(e) => setMuhasabah(e.target.value)}
                placeholder="Tuliskan hasil muhasabah dan refleksi diri Anda..."
                className="min-h-[140px] text-xs leading-relaxed"
              />

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Niat <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: NIAT PERUBAHAN ─── */}
          {step === 2 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900 flex items-center gap-2">
                  2. Niat Perubahan <Heart className="h-6 w-6 text-accent fill-accent" />
                </h1>
                <p className="text-xs text-gray-600">
                  Landasi seluruh ikhtiar perubahan ini semata-mata karena Allah SWT.
                </p>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 space-y-1 text-xs text-navy-900">
                <span className="font-bold uppercase text-[10px] text-amber-800 tracking-wider block">RUMUS NIAT:</span>
                <p className="font-serif italic text-sm text-navy-900">
                  &ldquo;Karena Allah, saya berkomitmen untuk tujuan perubahan Anda...&rdquo;
                </p>
              </div>

              <Textarea
                value={niat}
                onChange={(e) => setNiat(e.target.value)}
                placeholder="Tuliskan niat komitmen Anda..."
                className="min-h-[140px] text-xs font-serif italic"
              />

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Area <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: AREA TRANSFORMASI ─── */}
          {step === 3 && (
            <div className="space-y-6 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-border/60 pb-3">
                <div className="space-y-1">
                  <h1 className="text-3xl font-serif font-bold text-navy-900">3. Pilih Area Transformasi</h1>
                  <p className="text-xs text-gray-600">
                    Pilih area fokus utama yang menjadi prioritas pertumbuhan Anda (<strong>maksimal 3 area</strong>).
                  </p>
                </div>
                <div className="self-start sm:self-auto">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    selectedAreas.length === 3
                      ? "bg-amber-100 text-amber-900 border-amber-400"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}>
                    {selectedAreas.length}/3 Area Dipilih
                  </span>
                </div>
              </div>

              {selectedAreas.length >= 3 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Anda telah memilih batas maksimal 3 area fokus. Hapus centang salah satu area jika ingin memilih area lain.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areaOptions.map((area) => {
                  const isSelected = selectedAreas.includes(area.id);
                  const isMaxedOut = !isSelected && selectedAreas.length >= 3;
                  return (
                    <div
                      key={area.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAreas(selectedAreas.filter((a) => a !== area.id));
                        } else {
                          if (selectedAreas.length >= 3) return;
                          setSelectedAreas([...selectedAreas, area.id]);
                        }
                      }}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isMaxedOut
                          ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                          : isSelected
                          ? "border-navy-900 bg-navy-50/60 text-navy-900 font-semibold shadow-2xs cursor-pointer"
                          : "border-warm-border bg-white text-gray-600 hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <area.icon className="h-5 w-5 text-accent shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs">{area.label}</h4>
                          <p className="text-[11px] text-gray-500">{area.desc}</p>
                        </div>
                      </div>
                      <Checkbox checked={isSelected} disabled={isMaxedOut} className="rounded-md border-gray-300" />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Target <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: TARGET 90 HARI & INDIKATOR ─── */}
          {step === 4 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900">4. Target 90 Hari & Indikator</h1>
                <p className="text-xs text-gray-600">Tentukan 1 target utama dan 3 indikator keberhasilan terukur.</p>
              </div>

              {/* Panduan 4 Dimensi Indikator */}
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 space-y-2 text-xs text-navy-900">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Panduan Formulasi Indikator Keberhasilan (Terukur):</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Indikator yang baik dan terukur dapat dirumuskan melalui 4 dimensi utama:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="font-bold text-[#0B2C6B] block">1. Kualitas</span>
                    <p className="text-slate-600">Tingkat kekhusyukan & mutu (misal: <em>Sholat Tepat Waktu & Khusyu</em>)</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="font-bold text-[#0B2C6B] block">2. Kuantitas</span>
                    <p className="text-slate-600">Jumlah & target angka (misal: <em>Khatam Al-Qur&apos;an 1 juz/minggu</em>)</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="font-bold text-[#0B2C6B] block">3. Waktu</span>
                    <p className="text-slate-600">Jadwal & ketepatan (misal: <em>Bangun jam 04.00 WIB setiap subuh</em>)</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="font-bold text-[#0B2C6B] block">4. Biaya / Sedekah</span>
                    <p className="text-slate-600">Nominal & ikhtiar (misal: <em>Sedekah subuh Rp 20.000/hari</em>)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy-900 block">Target Utama 90 Hari:</label>
                  <Input
                    value={mainTarget}
                    onChange={(e) => setMainTarget(e.target.value)}
                    placeholder="Tulis target utama Anda..."
                    className="text-xs"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-warm-border/60">
                  <label className="text-xs font-bold text-navy-900 block">3 Indikator Keberhasilan:</label>
                  {indicators.map((ind, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      <Input
                        value={ind}
                        onChange={(e) => {
                          const newInds = [...indicators];
                          newInds[i] = e.target.value;
                          setIndicators(newInds);
                        }}
                        placeholder={`Indikator keberhasilan ke-${i + 1}...`}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(3)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Habits <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: SUSUN ACTION PLAN (HABITS) ─── */}
          {step === 5 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900">5. Susun Action Plan (Habits)</h1>
                <p className="text-xs text-gray-600">
                  Aktivitas harian/mingguan yang akan otomatis menjadi Habit Engine Anda.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-navy-900 block">Kebiasaan Harian</span>

                {actionPlans.map((ap) => (
                  <div key={ap.id} className="flex items-center justify-between bg-warm-bg/40 p-3 rounded-xl border border-warm-border text-xs">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                      <span className="font-semibold text-navy-900">{ap.title}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-md border border-warm-border">
                        {ap.frequency}
                      </span>
                      <button
                        onClick={() => removeActionPlan(ap.id)}
                        className="text-gray-400 hover:text-status-danger transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex space-x-2 pt-2">
                  <Input
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="Tambah kebiasaan baru..."
                    className="text-xs"
                  />
                  <Button onClick={addActionPlan} variant="outline" size="sm" className="text-xs font-bold shrink-0 gap-1">
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(4)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(6)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Tim Pendukung <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 6: TIM PENDUKUNG (SAHABAT SAFAR ONLY - COACH ASSIGNED BY ADMIN) ─── */}
          {step === 6 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900">6. Tim Pendukung & Coach</h1>
                <p className="text-xs text-gray-600">
                  Pendamping yang akan memantau & memandu perjalanan 90 hari Anda.
                </p>
              </div>

              <div className="space-y-4">
                {/* Coach info note */}
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Coach Utama</span>
                  <p className="text-xs text-navy-900 font-semibold">
                    Coach Personal Anda akan ditunjuk & ditugaskan langsung oleh Admin BinaHub.
                  </p>
                </div>

                {/* Sahabat Safar Field */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-navy-900 block">Sahabat Safar (Akuntabilitas):</label>
                  <Input
                    value={sahabatSafar}
                    onChange={(e) => setSahabatSafar(e.target.value)}
                    placeholder="Nama Sahabat Safar..."
                    className="text-xs mb-2"
                  />
                  <Input
                    value={sahabatRole}
                    onChange={(e) => setSahabatRole(e.target.value)}
                    placeholder="Peran / Hubungan (opsional)..."
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(5)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(7)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Review PTP <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 7: PENINJAUAN AKHIR DRAFT PTP ─── */}
          {step === 7 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-navy-900">7. Peninjauan Akhir Draft PTP</h1>
                <p className="text-xs text-gray-600">
                  Periksa seluruh isi dokumen PTP Anda sebelum melakukan komitmen final.
                </p>
              </div>

              <div className="space-y-3 text-xs bg-warm-bg/40 p-5 rounded-2xl border border-warm-border">
                <div className="flex justify-between items-start pb-3 border-b border-warm-border/60">
                  <div className="flex items-start space-x-3">
                    <Edit3 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-navy-900 block">Muhasabah</span>
                      <p className="text-gray-600 italic leading-relaxed">{muhasabah || "Belum diisi"}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-gray-400 hover:text-navy-900"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-warm-border/60">
                  <div className="flex items-start space-x-3">
                    <Heart className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-navy-900 block">Niat Perubahan</span>
                      <p className="text-gray-600 italic font-serif leading-relaxed">{niat || "Belum diisi"}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(2)} className="text-gray-400 hover:text-navy-900"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-warm-border/60">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-navy-900 block">Area Transformasi</span>
                      <p className="text-gray-600">{selectedAreas.join(", ") || "Belum diisi"}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(3)} className="text-gray-400 hover:text-navy-900"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-warm-border/60">
                  <div className="flex items-start space-x-3">
                    <Target className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-navy-900 block">Target & Indikator</span>
                      <p className="text-gray-600 font-semibold">{mainTarget || "Belum diisi"}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(4)} className="text-gray-400 hover:text-navy-900"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="flex justify-between items-start pt-2">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-navy-900 block">Action Plan (Habits)</span>
                      <p className="text-gray-600">{actionPlans.length} kebiasaan terdaftar</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(5)} className="text-gray-400 hover:text-navy-900"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(6)} className="text-xs text-gray-500">
                  Kembali & Edit
                </Button>
                <Button
                  onClick={() => setStep(8)}
                  className="bg-navy-900 hover:bg-black text-white font-bold text-xs gap-2 px-6 py-2.5 rounded-full"
                >
                  Lanjut ke Komitmen <ArrowRight className="h-4 w-4 text-amber-400" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 8: APPLE PAY STYLE COMMITMENT ─── */}
          {step === 8 && (
            <div className="space-y-6 py-4 text-center">
              {!isCommitted ? (
                <>
                  <div className="h-20 w-20 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-md animate-bounce">
                    <FileText className="h-10 w-10 text-amber-700" />
                  </div>

                  <div className="space-y-2">
                    <Badge className="bg-amber-100 text-amber-900 font-bold text-xs uppercase border-none px-3 py-1">
                      SIMPAN PTP & MULAI JOURNEY
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">
                      Langkah 8: Simpan & Mulai Perjalanan
                    </h1>
                    <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                      Setelah menekan tombol di bawah, Perjalanan 90 Hari Anda resmi dimulai (**Hari ke-1**). Personal Transformation Project Anda masih dapat disempurnakan selama masa revisi sebelum dikunci oleh Admin.
                    </p>
                  </div>

                  <div className="py-4 max-w-md mx-auto">
                    <Button
                      onClick={handleCommit}
                      disabled={committing}
                      className="w-full bg-navy-900 hover:bg-black text-white font-black text-base py-6 rounded-full shadow-lg border border-amber-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {committing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="h-5 w-5 animate-spin text-amber-400" /> Menyimpan PTP & Memulai Journey...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-amber-400" /> Saya Siap Memulai (Hari ke-1)
                        </span>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 py-6 animate-in fade-in zoom-in duration-500">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg border-4 border-emerald-200">
                    <CheckCircle2 className="h-10 w-10 stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <Badge className="bg-amber-500 text-white font-bold text-xs uppercase px-3 py-1">
                      Status: ACTIVE (PTP EDITABLE)
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">
                      Journey Resmi Dimulai!
                    </h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                      Perjalanan 90 Hari Anda telah dimulai hari ini (Hari ke-1). Personal Transformation Project Anda masih dapat direvisi selama belum dikunci oleh Admin.
                    </p>
                  </div>

                  <div className="pt-4 max-w-sm mx-auto">
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="bg-navy-900 hover:bg-black text-amber-300 font-bold text-sm gap-2 px-8 py-5 rounded-full shadow-md w-full"
                    >
                      Buka Dashboard Today <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Footer Bar matching screenshot */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 py-6 px-4 border-t border-warm-border/60 gap-2">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-navy-900 flex items-center justify-center text-amber-400 font-bold text-[10px]">
            SLJ
          </div>
          <span className="font-semibold text-gray-600">SLJ Personal Transformation Operating System • BinaJourney</span>
        </div>
        <span>© 2026 SLJ Personal Transformation Operating System • BinaJourney</span>
      </footer>
    </div>
  );
}
