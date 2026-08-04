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
import { TRANSFORMATION_AREAS } from "@/lib/transformation-areas";
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
  
  const [actionPlans, setActionPlans] = useState<{ id: string; title: string; frequency: string; areaCategory: string }[]>([]);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionFreq, setNewActionFreq] = useState("Setiap hari");
  const [newActionArea, setNewActionArea] = useState("Spiritual Growth");

  const [sahabatSafar, setSahabatSafar] = useState("");
  const [sahabatRole, setSahabatRole] = useState("");

  // Commitment State
  const [isCommitted, setIsCommitted] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [baselineScores, setBaselineScores] = useState<Record<string, number>>({});

  const totalSteps = 8;

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        try {
          const { data: assessment, error: assessmentError } = await supabase
            .from("baseline_assessments")
            .select("id")
            .eq("user_id", user.id)
            .eq("completed", true)
            .maybeSingle();
          if (assessmentError) throw assessmentError;
          const { data: bAnswers, error: answersError } = assessment
            ? await supabase.from("baseline_answers").select("area, score").eq("assessment_id", assessment.id)
            : { data: [], error: null };
          if (answersError) throw answersError;

          if (bAnswers && bAnswers.length > 0) {
            const areaSums: Record<string, { sum: number; count: number }> = {};
            bAnswers.forEach((ans: any) => {
              const aKey = ans.area;
              if (!areaSums[aKey]) areaSums[aKey] = { sum: 0, count: 0 };
              areaSums[aKey].sum += ans.score;
              areaSums[aKey].count += 1;
            });

            const keyMapping: Record<string, string> = {
              spiritual_growth: "Spiritual Growth",
              personal_development: "Personal Development",
              leadership_excellence: "Leadership Excellence",
              relationship: "Relationship",
              community_impact: "Community Impact",
            };

            const mapResult: Record<string, number> = {};
            Object.entries(areaSums).forEach(([aKey, val]) => {
              const title = keyMapping[aKey] || aKey;
              mapResult[title] = Math.round((val.sum / (val.count * 10)) * 100);
            });
            setBaselineScores(mapResult);
          }
        } catch (err) {
          console.error("Error fetching baseline scores for PTP setup:", err);
        }
      }
    }
    loadUserData();
  }, []);

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  const canContinue = (currentStep: number) => {
    if (currentStep === 1) return muhasabah.trim().length > 0;
    if (currentStep === 2) return niat.trim().length > 0;
    if (currentStep === 3) return selectedAreas.length === 3;
    if (currentStep === 4) return mainTarget.trim().length > 0;
    if (currentStep === 5) return actionPlans.length > 0;
    return true;
  };

  const continueTo = (nextStep: number) => {
    if (!canContinue(step)) {
      const messages: Record<number, string> = {
        1: "Isi Muhasabah sebelum melanjutkan.",
        2: "Isi Niat Perubahan sebelum melanjutkan.",
        3: "Pilih tepat 3 area transformasi sebelum melanjutkan.",
        4: "Isi Target Utama 90 Hari sebelum melanjutkan.",
        5: "Tambahkan minimal satu Action Plan sebelum melanjutkan.",
      };
      setCommitError(messages[step] || "Lengkapi bagian ini sebelum melanjutkan.");
      return;
    }
    setCommitError(null);
    setStep(nextStep);
  };

  const addActionPlan = () => {
    if (newActionTitle.trim() && selectedAreas.length > 0) {
      if (actionPlans.some(plan => plan.title.trim().toLowerCase() === newActionTitle.trim().toLowerCase())) {
        setCommitError("Action Plan dengan nama yang sama sudah ada.");
        return;
      }
      setActionPlans([
        ...actionPlans,
        { id: String(Date.now()), title: newActionTitle.trim(), frequency: newActionFreq, areaCategory: newActionArea || selectedAreas[0] || "Spiritual Growth" },
      ]);
      setNewActionTitle("");
      setCommitError(null);
    }
  };

  const removeActionPlan = (id: string) => {
    setActionPlans(actionPlans.filter((a) => a.id !== id));
  };

  const handleCommit = async () => {
    setCommitting(true);
    setCommitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;

      if (!currentUserId) {
        setCommitError("Sesi login telah berakhir. Silakan login ulang.");
        setCommitting(false);
        return;
      }

      if (selectedAreas.length !== 3) {
        setCommitError("Pilih tepat 3 area transformasi sebelum memulai Journey.");
        return;
      }
      if (!muhasabah.trim() || !niat.trim() || !mainTarget.trim()) {
        setCommitError("Lengkapi Muhasabah, Niat Perubahan, dan Target Utama sebelum memulai Journey.");
        return;
      }
      if (actionPlans.length === 0 || actionPlans.some(plan => !selectedAreas.includes(plan.areaCategory))) {
        setCommitError("Tambahkan minimal satu Action Plan dan pastikan setiap Action Plan menggunakan area yang dipilih.");
        return;
      }

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("start_date, end_date")
        .eq("user_id", currentUserId)
        .maybeSingle();
      if (existingProfileError) throw existingProfileError;

      const startDate = existingProfile?.start_date ? new Date(existingProfile.start_date) : new Date();
      const endDate = existingProfile?.end_date ? new Date(existingProfile.end_date) : new Date(startDate);
      if (!existingProfile?.end_date) endDate.setDate(startDate.getDate() + 89);

      const { error: profileErr } = await supabase.from("profiles").upsert({
        user_id: currentUserId,
        full_name: user?.user_metadata?.full_name || "Peserta SLJ",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        role: "participant",
      });
      if (profileErr) throw profileErr;

      // 1b. Ensure profile start_date is set to TODAY if not already
      // 2. Save Journey (ACTIVE + EDITABLE) — with onConflict to prevent duplicates
      const { data: journey, error: journeyErr } = await supabase.from("journeys").upsert({
        user_id: currentUserId,
        status: "ACTIVE",
        ptp_status: "EDITABLE",
        muhasabah,
        niat,
        area_transformasi: selectedAreas,
        main_target: JSON.stringify(Object.fromEntries(selectedAreas.map((area) => [area, {
          mainTarget,
          kualitas: indicators[0] || "",
          kuantitas: indicators[1] || "",
          waktu: indicators[2] || "",
          biaya: "",
        }]))),
        success_indicators: indicators.filter((i) => i.trim() !== ""),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).select().maybeSingle();

      if (journeyErr) {
        console.error("Error upsert journey:", journeyErr);
        setCommitError(`Gagal menyimpan journey: ${journeyErr.message}`);
        setCommitting(false);
        return;
      }

      // 3. Save Action Plans & Habits
      if (journey) {
        const errors: string[] = [];

        const { error: clearPlansError } = await supabase.from("action_plans").delete().eq("journey_id", journey.id);
        if (clearPlansError) throw clearPlansError;

        for (const ap of actionPlans) {
          const { data: apData, error: apErr } = await supabase.from("action_plans").insert({
            journey_id: journey.id,
            user_id: currentUserId,
            title: ap.title,
            category: ap.areaCategory,
            area_category: ap.areaCategory,
            frequency: ap.frequency,
            quantity: 1,
            target: 1,
          }).select().maybeSingle();

          if (apErr) {
            console.error("Error insert action_plan:", apErr);
            errors.push(`Action plan "${ap.title}": ${apErr.message}`);
            continue;
          }

          const { error: habitErr } = await supabase.from("habits").insert({
            user_id: currentUserId,
            action_plan_id: apData?.id || null,
            title: ap.title,
            category: ap.areaCategory,
            area_category: ap.areaCategory,
            frequency: ap.frequency,
            quantity: 1,
            target: 1,
          });

          if (habitErr) {
            console.error("Error insert habit:", habitErr);
            errors.push(`Habit "${ap.title}": ${habitErr.message}`);
          }
        }

        // Save Initial PTP Snapshot
        const { error: snapshotErr } = await supabase.from("ptp_snapshots").insert({
          journey_id: journey.id,
          user_id: currentUserId,
          version: 1,
          trigger_type: "INITIAL",
          snapshot_data: {
            muhasabah,
            niat,
            area_transformasi: selectedAreas,
            main_target: JSON.stringify(Object.fromEntries(selectedAreas.map((area) => [area, {
              mainTarget,
              kualitas: indicators[0] || "",
              kuantitas: indicators[1] || "",
              waktu: indicators[2] || "",
              biaya: "",
            }]))),
            success_indicators: indicators.filter((i) => i.trim() !== ""),
            action_plans: actionPlans,
          },
        });

        if (snapshotErr) {
          console.error("Error insert ptp_snapshot:", snapshotErr);
          errors.push(`PTP Snapshot: ${snapshotErr.message}`);
        }

        // 4. Save Support Team
        if (sahabatSafar) {
          const { error: stErr } = await supabase.from("support_team").insert({
            journey_id: journey.id,
            user_id: currentUserId,
            sahabat_safar_name: sahabatSafar,
          });

          if (stErr) {
            console.error("Error insert support_team:", stErr);
            errors.push(`Sahabat Safar: ${stErr.message}`);
          }
        }

        if (errors.length > 0) {
          setCommitError(`Journey berhasil dibuat, tapi beberapa item gagal tersimpan:\n${errors.join("; ")}`);
          return;
        }
      }

      setIsCommitted(true);
    } catch (err) {
      console.error("Error saving journey to Supabase:", err);
      setCommitError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setCommitting(false);
    }
  };

  const areaOptions = [
    { id: "Spiritual Growth", icon: Compass, label: "Spiritual Growth", desc: <>hubungan kita dengan Allah <span className="text-[1.15em] leading-none">ﷻ</span></>, color: TRANSFORMATION_AREAS["Spiritual Growth"].color },
    { id: "Personal Development", icon: Zap, label: "Personal Development", desc: "hubungan kita dengan diri sendiri", color: TRANSFORMATION_AREAS["Personal Development"].color },
    { id: "Leadership Excellence", icon: Award, label: "Leadership/Profesional Excellence", desc: "amanah, tugas dan tanggung jawab kita dalam pekerjaan", color: TRANSFORMATION_AREAS["Leadership Excellence"].color },
    { id: "Relationship", icon: Users, label: "Relationship", desc: "hubungan kita dengan orang lain", color: TRANSFORMATION_AREAS.Relationship.color },
    { id: "Community Impact", icon: Globe, label: "Community Impact", desc: "dampak terhadap lingkungan sekitar", color: TRANSFORMATION_AREAS["Community Impact"].color },
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
              <h1 className="sr-only">Setup Personal Transformation Project</h1>
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

          {commitError && step < 8 && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{commitError}</span>
              <button type="button" onClick={() => setCommitError(null)} className="text-rose-400 hover:text-rose-700" aria-label="Tutup pesan">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ─── STEP 1: MUHASABAH ─── */}
          {step === 1 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif font-bold text-navy-900">1. Muhasabah</h2>
                <p className="text-xs text-gray-600">
                  Apa hal terbesar yang ingin Anda perbaiki dan transformasikan selama 90 hari ke depan?
                </p>
              </div>

              {/* Prompt guide box */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 space-y-2 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">1.</span>
                  <span>Apa bagian dari hati dan kehidupan saya yang paling membutuhkan pertolongan Allah?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">2.</span>
                  <span>Apa yang paling ingin saya perbaiki melalui program ini?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">3.</span>
                  <span>Kenapa area perbaikan itu penting?</span>
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
                  onClick={() => continueTo(2)}
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
                <h2 className="text-3xl font-serif font-bold text-navy-900 flex items-center gap-2">
                  2. Niat Perubahan <Heart className="h-6 w-6 text-accent fill-accent" />
                </h2>
                <p className="text-xs text-gray-600">
                  Landasi seluruh ikhtiar perubahan ini semata-mata karena Allah <span className="text-[1.15em] leading-none">ﷻ</span>.
                </p>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 space-y-2 text-xs text-navy-900">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">1.</span>
                  <span>Mengapa saya ingin berangkat Umrah, dan apakah niat saya benar-benar karena Allah? Bagaimana saya meluruskan niat ini?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">2.</span>
                  <span>Pribadi seperti apa yang ingin saya bentuk setelah kembali dari Tanah Suci?</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">3.</span>
                  <span>Apa komitmen yang saya ikrarkan kepada Allah untuk mewujudkan perubahan itu?</span>
                </div>
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
                  onClick={() => continueTo(3)}
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
                  <h2 className="text-3xl font-serif font-bold text-navy-900">3. Pilih Area Transformasi</h2>
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

              {/* Baseline recommendation note if baseline answers exist */}
              {Object.keys(baselineScores).length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Rekomendasi area diselaraskan dengan hasil asesmen Baseline 50 Soal Anda.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const lowestEntry = Object.entries(baselineScores).sort((a, b) => a[1] - b[1])[0];
                  const lowestAreaKey = lowestEntry ? lowestEntry[0] : null;

                  return areaOptions.map((area) => {
                    const isSelected = selectedAreas.includes(area.id);
                    const isMaxedOut = !isSelected && selectedAreas.length >= 3;
                    const areaScore = baselineScores[area.id];
                    const isRecommended = area.id === lowestAreaKey;

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
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                          isMaxedOut
                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                            : isSelected
                            ? "bg-white text-navy-900 font-semibold shadow-2xs cursor-pointer"
                            : "border-warm-border bg-white text-gray-600 hover:border-gray-300 cursor-pointer"
                        }`}
                        style={isSelected ? { borderColor: area.color, boxShadow: `inset 4px 0 0 ${area.color}` } : undefined}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-center space-x-3">
                            <area.icon className="h-5 w-5 shrink-0" style={{ color: area.color }} />
                            <div>
                              <h4 className="font-bold text-xs">{area.label}</h4>
                              <p className="text-[11px] text-gray-500">{area.desc}</p>
                            </div>
                          </div>
                          <Checkbox checked={isSelected} disabled={isMaxedOut} className="rounded-md border-gray-300 mt-1" />
                        </div>

                        {/* Baseline score badge */}
                        {(areaScore !== undefined || isRecommended) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                            {areaScore !== undefined && (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                                Skor Baseline: {areaScore}%
                              </span>
                            )}
                            {isRecommended && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                💡 Direkomendasikan
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-warm-border/60">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-xs text-gray-500">
                  Kembali
                </Button>
                <Button
                  onClick={() => continueTo(4)}
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
                <h2 className="text-3xl font-serif font-bold text-navy-900">4. Target 90 Hari & Indikator</h2>
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
                  onClick={() => continueTo(5)}
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
                <h2 className="text-3xl font-serif font-bold text-navy-900">5. Susun Action Plan (Habits)</h2>
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

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 pt-2">
                  <Input
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="Tambah kebiasaan baru..."
                    className="text-xs"
                  />
                  <select
                    value={selectedAreas.includes(newActionArea) ? newActionArea : selectedAreas[0] || "Spiritual Growth"}
                    onChange={(event) => setNewActionArea(event.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-navy-900"
                    aria-label="Area transformasi Action Plan"
                  >
                    {selectedAreas.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
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
                  onClick={() => continueTo(6)}
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
                <h2 className="text-3xl font-serif font-bold text-navy-900">6. Tim Pendukung & Coach</h2>
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
                  onClick={() => continueTo(7)}
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
                <h2 className="text-3xl font-serif font-bold text-navy-900">7. Peninjauan Akhir Draft PTP</h2>
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
                  onClick={() => continueTo(8)}
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
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">
                      Langkah 8: Simpan & Mulai Perjalanan
                    </h2>
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

                    {commitError && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium text-left">
                        <p className="font-bold mb-1">⚠️ Terjadi Kesalahan:</p>
                        <p>{commitError}</p>
                        <button
                          onClick={() => setCommitError(null)}
                          className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 underline"
                        >
                          Tutup pesan ini
                        </button>
                      </div>
                    )}
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

                  {commitError && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium text-left max-w-md mx-auto space-y-1 shadow-2xs">
                      <p className="font-bold flex items-center gap-1.5 text-amber-800">
                        ⚠️ Perhatian (Penyimpanan Parsial):
                      </p>
                      <p className="whitespace-pre-line leading-relaxed">{commitError}</p>
                      <button
                        onClick={() => setCommitError(null)}
                        className="mt-1 text-[11px] text-amber-700 hover:text-amber-900 underline"
                      >
                        Tutup pesan ini
                      </button>
                    </div>
                  )}

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
