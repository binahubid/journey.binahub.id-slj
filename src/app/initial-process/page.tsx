"use client";

import { useState, useEffect } from "react";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  User,
  MapPin,
  Building,
  Briefcase,
  Clock,
  Phone,
  Compass,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Send,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ── TYPES & CONSTANTS ──────────────────────────────────────────────────────

interface Layer1Data {
  gender: string;
  birthYear: string;
  city: string;
  company: string;
  division: string;
  role: string;
  commMedia: string[]; // max 2
  commTime: string;
  umrahExperience: string;
}

interface Layer2Points {
  spiritual_growth: number;
  personal_development: number;
  relationship: number;
  leadership_excellence: number;
  community_impact: number;
}

interface Layer3Data {
  spontaneousSupport: string[]; // max 3
  expectedSupport: string[]; // max 3
  otherSpontaneous?: string;
  otherExpected?: string;
}

interface PreferenceData {
  contactPreference: string;
  commFrequency: string;
  whenILoseSpirit: string;
  whenPartnerLosesSpirit: string;
  discussionMedia: string;
  relationshipExpectation: string;
  bestContribution: string;
}

const GENDER_OPTIONS = ["Pria", "Wanita"];
const UMRAH_OPTIONS = ["Sudah Pernah", "Belum Pernah"];
const COMM_MEDIA_OPTIONS = ["WhatsApp Chat", "Voice Note", "Telepon", "Video Call", "Tatap Muka"];
const COMM_TIME_OPTIONS = ["Pagi", "Siang", "Sore", "Malam", "Fleksibel"];

const SUPPORT_EXCHANGE_OPTIONS = [
  "Menjadi pendengar",
  "Memberi semangat",
  "Mengingatkan tujuan",
  "Membantu menyusun langkah",
  "Mengajak refleksi",
  "Memberikan solusi praktis",
  "Mengingatkan ibadah/doa",
  "Menghubungi lebih dulu",
  "Teman berdiskusi",
  "Menjaga konsistensi",
];

function getGenerationLabel(yearStr: string): string {
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1920 || year > 2030) return "";
  if (year >= 2013) return "Gen Alpha";
  if (year >= 1997) return "Gen Z";
  if (year >= 1981) return "Millennial (Gen Y)";
  if (year >= 1965) return "Gen X";
  return "Baby Boomer";
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function InitialProcessPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeStep, setActiveStep] = useState<number>(1); // 1: Eligibility, 2: Priority (100 pts), 3: Support Exchange, 4: Journey Prefs, 5: Done
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const handleStepChange = (nextStep: number) => {
    setActiveStep(nextStep);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Layer 1
  const [layer1, setLayer1] = useState<Layer1Data>({
    gender: "",
    birthYear: "",
    city: "",
    company: "",
    division: "",
    role: "",
    commMedia: [],
    commTime: "",
    umrahExperience: "",
  });

  // Layer 2 (100 Poin - Starts from 0)
  const [layer2, setLayer2] = useState<Layer2Points>({
    spiritual_growth: 0,
    personal_development: 0,
    relationship: 0,
    leadership_excellence: 0,
    community_impact: 0,
  });

  // Layer 3
  const [layer3, setLayer3] = useState<Layer3Data>({
    spontaneousSupport: [],
    expectedSupport: [],
    otherSpontaneous: "",
    otherExpected: "",
  });

  // Preferences
  const [prefs, setPrefs] = useState<PreferenceData>({
    contactPreference: "",
    commFrequency: "",
    whenILoseSpirit: "",
    whenPartnerLosesSpirit: "",
    discussionMedia: "",
    relationshipExpectation: "",
    bestContribution: "",
  });

  // ── LOAD INITIAL DATA ─────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Try restoring from localStorage first
        const savedDraft = localStorage.getItem(`sahabat_safar_profile_draft:${user.id}`);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.layer1) setLayer1(parsed.layer1);
          if (parsed.layer2) setLayer2(parsed.layer2);
          if (parsed.layer3) setLayer3(parsed.layer3);
          if (parsed.prefs) setPrefs(parsed.prefs);
          if (parsed.submitted) { setSubmitted(true); setActiveStep(5); }
        }

        // Try loading from Supabase sahabat_safar_profiles if table exists
        const { data: profile, error: profileError } = await supabase
          .from("sahabat_safar_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        if (profile) {
          if (profile.layer1) setLayer1(profile.layer1);
          if (profile.layer2) setLayer2(profile.layer2);
          if (profile.layer3) setLayer3(profile.layer3);
          if (profile.preferences) setPrefs(profile.preferences);
          setSubmitted(profile.is_completed || false);
          if (profile.is_completed) setActiveStep(5);
        }
      } catch (err) {
        console.error("Load Sahabat Safar profile error:", err);
        setLoadError("Data Initial Process belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  // Save draft locally
  const saveDraft = (newL1 = layer1, newL2 = layer2, newL3 = layer3, newPrefs = prefs) => {
    try {
      if (!userId) return;
      localStorage.setItem(`sahabat_safar_profile_draft:${userId}`, JSON.stringify({
        layer1: newL1,
        layer2: newL2,
        layer3: newL3,
        prefs: newPrefs,
        updated_at: new Date().toISOString(),
      }));
    } catch {}
  };

  useEffect(() => {
    if (!loading && userId) saveDraft(layer1, layer2, layer3, prefs);
  }, [layer1, layer2, layer3, prefs, loading, userId]);

  // Helper toggle commMedia (max 2)
  const toggleCommMedia = (item: string) => {
    setLayer1((prev) => {
      let next: string[];
      if (prev.commMedia.includes(item)) {
        next = prev.commMedia.filter((m) => m !== item);
      } else {
        if (prev.commMedia.length >= 2) return prev;
        next = [...prev.commMedia, item];
      }
      const updated = { ...prev, commMedia: next };
      saveDraft(updated);
      return updated;
    });
  };

  // Helper toggle Layer 3 choices (max 3)
  const toggleLayer3Choice = (field: "spontaneousSupport" | "expectedSupport", item: string) => {
    setLayer3((prev) => {
      const arr = prev[field];
      let next: string[];
      if (arr.includes(item)) {
        next = arr.filter((x) => x !== item);
      } else {
        if (arr.length >= 3) return prev;
        next = [...arr, item];
      }
      const updated = { ...prev, [field]: next };
      saveDraft(undefined, undefined, updated);
      return updated;
    });
  };

  // Calculate total points for Layer 2
  const totalPoints = Object.values(layer2).reduce((a, b) => a + (Number(b) || 0), 0);

  // Submit profile to Supabase
  const handleSubmit = async () => {
    const validationError = getValidationError();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      const payload = {
        user_id: user.id,
        layer1,
        layer2,
        layer3,
        preferences: prefs,
        is_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Upsert to Supabase
      const { error } = await supabase
        .from("sahabat_safar_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.error("Supabase upsert error:", error);
        throw new Error(`Gagal menyimpan instrumen ke server: ${error.message}`);
      }

      // Save locally as optimistic backup
      localStorage.setItem(`sahabat_safar_profile_draft:${user.id}`, JSON.stringify({
        ...payload,
        submitted: true,
      }));

      setSubmitted(true);
      setActiveStep(5);
    } catch (err: any) {
      console.error("Submit profile error:", err);
      setErrorMessage(err?.message || "Gagal menyimpan data profil. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const getValidationError = () => {
    const currentYear = new Date().getFullYear();
    if (!layer1.gender || !layer1.birthYear || !layer1.city || !layer1.company || !layer1.division || !layer1.role || !layer1.commTime || layer1.commMedia.length === 0 || !layer1.umrahExperience) {
      return "Lengkapi seluruh informasi dasar di Layer 1 sebelum melanjutkan.";
    }
    const birthYear = Number(layer1.birthYear);
    if (!Number.isInteger(birthYear) || birthYear < 1920 || birthYear > currentYear - 15) return "Masukkan tahun lahir yang valid.";
    if (totalPoints !== 100) return "Total alokasi poin untuk Layer 2 harus tepat 100 poin.";
    if (layer3.spontaneousSupport.length === 0 || layer3.expectedSupport.length === 0) return "Pilih minimal satu bentuk dukungan pada kedua bagian Layer 3.";
    if (Object.values(prefs).some(value => !value.trim())) return "Lengkapi seluruh preferensi perjalanan di Layer 4.";
    return "";
  };

  const canOpenStep = (step: number) => {
    if (submitted) return true;
    if (step <= activeStep) return true;
    if (step === 2) return !getLayer1ValidationError();
    if (step === 3) return !getLayer1ValidationError() && totalPoints === 100;
    if (step === 4) return !getLayer1ValidationError() && totalPoints === 100 && layer3.spontaneousSupport.length > 0 && layer3.expectedSupport.length > 0;
    return false;
  };

  const getLayer1ValidationError = () => !layer1.gender || !layer1.birthYear || !layer1.city || !layer1.company || !layer1.division || !layer1.role || !layer1.commTime || layer1.commMedia.length === 0 || !layer1.umrahExperience;

  const continueToStep = (step: number) => {
    const validationError = getValidationError();
    if (step === 2 && getLayer1ValidationError()) { setErrorMessage("Lengkapi seluruh informasi dasar di Layer 1 sebelum melanjutkan."); return; }
    if (step === 3 && (getLayer1ValidationError() || totalPoints !== 100)) { setErrorMessage(getLayer1ValidationError() ? "Lengkapi Layer 1 terlebih dahulu." : "Total alokasi poin harus tepat 100 Poin."); return; }
    if (step === 4 && (getLayer1ValidationError() || totalPoints !== 100 || layer3.spontaneousSupport.length === 0 || layer3.expectedSupport.length === 0)) { setErrorMessage(validationError || "Lengkapi Layer 3 sebelum melanjutkan."); return; }
    setErrorMessage("");
    handleStepChange(step);
  };

  if (loading) {
    return (
      <ParticipantLayout activePath="/initial-process" pageTitle="Initial Process — Sahabat Safar Profile">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout activePath="/initial-process" pageTitle="Initial Process — Sahabat Safar Profile">
      <main className="max-w-4xl mx-auto pt-4 pb-20 space-y-6 font-sans">

        {/* ── HEADER BANNER ───────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#071A33] via-navy-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border border-slate-700/50 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Initial Process: Sahabat Safar Matching Profile</h1>
              <p className="text-xs text-slate-300">Instrumen rekomendasi pairing Sahabat Safar oleh Tim binaJourney.</p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="pt-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 text-center text-xs font-semibold">
            {[
              { num: 1, label: "Filter Eligibility" },
              { num: 2, label: "Prioritas (100 Poin)" },
              { num: 3, label: "Support Exchange" },
              { num: 4, label: "Journey Preference" },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => {
                  if (!canOpenStep(s.num)) {
                    setErrorMessage("Selesaikan langkah sebelumnya sebelum membuka bagian ini.");
                    return;
                  }
                  setErrorMessage("");
                  handleStepChange(s.num);
                }}
                className={`py-2 px-1 rounded-xl transition-all border ${
                  activeStep === s.num
                    ? "bg-amber-400 text-navy-900 border-amber-300 font-extrabold shadow-sm"
                    : activeStep > s.num
                    ? "bg-white/10 text-emerald-300 border-white/20"
                    : `bg-white/5 text-slate-400 border-white/10 ${!canOpenStep(s.num) ? "cursor-not-allowed opacity-60" : ""}`
                }`}
              >
                <div className="text-[11px] sm:text-[10px] uppercase tracking-wider font-extrabold">Step {s.num}</div>
                <div className="truncate text-xs hidden sm:block">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── ERROR ALERT ─────────────────────────────────────────────────── */}
        {(errorMessage || loadError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage || loadError}</span>
          </div>
        )}

        {/* ── STEP 1: LAYER 1 ELIGIBILITY FILTER ──────────────────────────── */}
        {activeStep === 1 && (
          <Card className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-navy-900">LAYER 1 – Eligibility Filter</h2>
                <p className="text-xs text-slate-500">Informasi dasar domisili, pekerjaan, & kecenderungan komunikasi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Jenis Kelamin */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">1. Jenis Kelamin</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setLayer1({ ...layer1, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        layer1.gender === g
                          ? "bg-navy-900 text-white border-navy-900 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tahun Lahir */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  2. Tahun Lahir {getGenerationLabel(layer1.birthYear) && <span className="text-amber-600">({getGenerationLabel(layer1.birthYear)})</span>}
                </label>
                <Input
                  type="number"
                  placeholder="Contoh: 1992"
                  value={layer1.birthYear}
                  onChange={(e) => setLayer1({ ...layer1, birthYear: e.target.value })}
                  className="rounded-xl h-10 border-slate-200 focus:border-amber-400 text-xs"
                />
              </div>

              {/* Kota Domisili */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">3. Kota Domisili</label>
                <Input
                  placeholder="Contoh: Jakarta Selatan, Surabaya, Bandung..."
                  value={layer1.city}
                  onChange={(e) => setLayer1({ ...layer1, city: e.target.value })}
                  className="rounded-xl h-10 border-slate-200 focus:border-amber-400 text-xs"
                />
              </div>

              {/* Perusahaan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">4. Nama Perusahaan</label>
                <Input
                  placeholder="Nama perusahaan / instansi..."
                  value={layer1.company}
                  onChange={(e) => setLayer1({ ...layer1, company: e.target.value })}
                  className="rounded-xl h-10 border-slate-200 focus:border-amber-400 text-xs"
                />
              </div>

              {/* Unit/Divisi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">5. Unit / Divisi / Fungsi</label>
                <Input
                  placeholder="Contoh: IT Infrastructure, Marketing, HR..."
                  value={layer1.division}
                  onChange={(e) => setLayer1({ ...layer1, division: e.target.value })}
                  className="rounded-xl h-10 border-slate-200 focus:border-amber-400 text-xs"
                />
              </div>

              {/* Jabatan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">6. Jabatan</label>
                <Input
                  placeholder="Contoh: Manager, Senior Specialist..."
                  value={layer1.role}
                  onChange={(e) => setLayer1({ ...layer1, role: e.target.value })}
                  className="rounded-xl h-10 border-slate-200 focus:border-amber-400 text-xs"
                />
              </div>

              {/* Waktu Komunikasi */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-700 block">7. Waktu Komunikasi Paling Nyaman</label>
                <div className="flex flex-wrap gap-2">
                  {COMM_TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLayer1({ ...layer1, commTime: t })}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        layer1.commTime === t
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Komunikasi (Maks 2) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-700 block">
                  8. Media Komunikasi Nyaman <span className="text-amber-600 font-normal">(Pilih maks. 2)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMM_MEDIA_OPTIONS.map((m) => {
                    const sel = layer1.commMedia.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleCommMedia(m)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          sel
                            ? "bg-navy-900 text-white border-navy-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {sel ? "✓ " : "+ "} {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pengalaman Umrah */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-700 block">9. Pengalaman Umrah</label>
                <div className="flex gap-3 max-w-sm">
                  {UMRAH_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setLayer1({ ...layer1, umrahExperience: u })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        layer1.umrahExperience === u
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                 onClick={() => continueToStep(2)}
                className="bg-navy-900 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-2"
              >
                Lanjut<span className="hidden sm:inline"> ke Layer 2: Prioritas</span> <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 2: LAYER 2 TRANSFORMATION PRIORITY (100 PTS) ──────────── */}
        {activeStep === 2 && (
          <Card className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-900">LAYER 2 – Transformation Priority</h2>
                  <p className="text-xs text-slate-500">Alokasikan total <span className="font-bold text-amber-600">100 poin</span> ke 5 area pertumbuhan.</p>
                </div>
              </div>
              <Badge
                className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${
                  totalPoints === 100
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                Total: {totalPoints} / 100 Poin
              </Badge>
            </div>

            <div className="space-y-4">
              {[
                { key: "spiritual_growth", title: "Spiritual Growth", desc: <>hubungan kita dengan Allah <span className="text-[1.15em] leading-none">ﷻ</span></> },
                { key: "personal_development", title: "Personal Development", desc: "hubungan kita dengan diri sendiri" },
                { key: "leadership_excellence", title: "Leadership Excellence", desc: "amanah, tugas dan tanggung jawab kita dalam pekerjaan" },
                { key: "relationship", title: "Relationship", desc: "hubungan kita dengan orang lain" },
                { key: "community_impact", title: "Community Impact", desc: "dampak terhadap lingkungan sekitar" },
              ].map((item) => {
                const val = layer2[item.key as keyof Layer2Points] || 0;
                return (
                  <div key={item.key} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-navy-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                      <span className="text-sm font-black text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-2xs">
                        {val}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={val}
                      onChange={(e) => {
                        const targetV = parseInt(e.target.value, 10) || 0;
                        const currentTotalExceptThis = totalPoints - val;
                        const maxForThis = Math.max(0, 100 - currentTotalExceptThis);
                        if (targetV > val && totalPoints >= 100) return;
                        const finalV = Math.min(targetV, maxForThis);
                        setLayer2({ ...layer2, [item.key]: finalV });
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => handleStepChange(1)}
                className="rounded-xl h-10 text-xs border-slate-200"
              >
                <ChevronLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button
                onClick={() => {
                  if (totalPoints !== 100) {
                    setErrorMessage("Total alokasi poin harus tepat 100 Poin.");
                    return;
                  }
                  setErrorMessage("");
                   continueToStep(3);
                }}
                className="bg-navy-900 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-2"
              >
                Lanjut<span className="hidden sm:inline"> ke Layer 3: Support Exchange</span> <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 3: LAYER 3 SUPPORT EXCHANGE ─────────────────────────────── */}
        {activeStep === 3 && (
          <Card className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-navy-900">LAYER 3 – Support Exchange</h2>
                <p className="text-xs text-slate-500">Kecenderungan Anda memberi & menerima dukungan.</p>
              </div>
            </div>

            {/* Q1: Spontan saat teman kesulitan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                1. Ketika ada teman yang sedang menghadapi kesulitan, saya biasanya paling spontan... <span className="text-amber-600">(Pilih maks. 3)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SUPPORT_EXCHANGE_OPTIONS.map((opt) => {
                  const sel = layer3.spontaneousSupport.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLayer3Choice("spontaneousSupport", opt)}
                      className={`p-3 rounded-xl border text-left font-medium transition-all ${
                        sel
                          ? "bg-amber-500 text-white border-amber-500 font-bold shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      {sel ? "✓ " : "+ "} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2: Harapan saat diri sendiri kesulitan */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">
                2. Ketika saya sedang mengalami kesulitan, saya paling berharap Sahabat Safar saya... <span className="text-amber-600">(Pilih maks. 3)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SUPPORT_EXCHANGE_OPTIONS.map((opt) => {
                  const sel = layer3.expectedSupport.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLayer3Choice("expectedSupport", opt)}
                      className={`p-3 rounded-xl border text-left font-medium transition-all ${
                        sel
                          ? "bg-navy-900 text-white border-navy-900 font-bold shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-navy-300"
                      }`}
                    >
                      {sel ? "✓ " : "+ "} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => handleStepChange(2)} className="rounded-xl h-10 text-xs border-slate-200">
                <ChevronLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button
                 onClick={() => continueToStep(4)}
                className="bg-navy-900 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-2"
              >
                Lanjut<span className="hidden sm:inline"> ke Journey Preference</span> <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 4: JOURNEY PREFERENCE (TIE-BREAKER) ───────────────────────── */}
        {activeStep === 4 && (
          <Card className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-base font-bold text-navy-900">Journey Preference (Tie-breaker)</h2>
                <p className="text-xs text-slate-500">Gaya interaksi & ekspektasi pendampingan Sahabat Safar.</p>
              </div>
            </div>

            <div className="space-y-5 text-xs">
              {/* Q3: Inisiatif Kontak */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">3. Saya lebih nyaman jika Sahabat Safar saya...</label>
                <div className="flex flex-wrap gap-2">
                  {["Sering menghubungi terlebih dahulu", "Bergantian", "Tidak ada preferensi"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, contactPreference: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.contactPreference === opt
                          ? "bg-navy-900 text-white border-navy-900 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Frekuensi Komunikasi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">4. Frekuensi Komunikasi</label>
                <div className="flex flex-wrap gap-2">
                  {["Hampir setiap hari", "2–3 kali seminggu", "Seminggu sekali", "Sesuai kebutuhan"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, commFrequency: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.commFrequency === opt
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q5: Saat Kehilangan Semangat */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">5. Jika saya kehilangan semangat, saya ingin diperlakukan...</label>
                <div className="flex flex-wrap gap-2">
                  {["Tegas", "Lembut", "Diskusi", "Bertanya perkembangan", "Memberi waktu"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, whenILoseSpirit: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.whenILoseSpirit === opt
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q6: Saat Pasangan Kehilangan Semangat */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">6. Jika Sahabat Safar saya kehilangan semangat, respon saya biasanya...</label>
                <div className="flex flex-wrap gap-2">
                  {["Langsung menghubungi", "Menunggu", "Mengirim penyemangat", "Mengajak diskusi", "Mengingatkan target"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, whenPartnerLosesSpirit: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.whenPartnerLosesSpirit === opt
                          ? "bg-navy-900 text-white border-navy-900 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q7: Media Diskusi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">7. Media Utama Diskusi</label>
                <div className="flex flex-wrap gap-2">
                  {["Chat", "Voice Note", "Telepon", "Video Call", "Tatap Muka"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, discussionMedia: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.discussionMedia === opt
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q8: Harapan Hubungan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">8. Harapan Hubungan Sahabat Safar</label>
                <div className="flex flex-wrap gap-2">
                  {["Selesai saat program", "Berlanjut bila berkenan", "Sahabat jangka panjang"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, relationshipExpectation: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.relationshipExpectation === opt
                          ? "bg-navy-900 text-white border-navy-900 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q9: Yang Ingin Diberikan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">9. Yang Paling Ingin Saya Berikan kepada Sahabat Safar Saya</label>
                <div className="flex flex-wrap gap-2">
                  {["Teladan", "Semangat", "Pendengar", "Pengingat kepada Allah", "Teman diskusi", "Pendamping istiqamah"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, bestContribution: opt })}
                      className={`px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                        prefs.bestContribution === opt
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={() => handleStepChange(3)} className="rounded-xl h-10 text-xs border-slate-200">
                <ChevronLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl px-5 sm:px-8 h-11 shadow-md flex items-center gap-2"
              >
                <span>
                  {submitting ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <span className="sm:hidden">Submit</span>
                      <span className="hidden sm:inline">Kirim Profil Sahabat Safar</span>
                    </>
                  )}
                </span>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 5: COMPLETED CONFIRMATION ──────────────────────────────── */}
        {activeStep === 5 && submitted && (
          <Card className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-5 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-navy-900">Profil Sahabat Safar Berhasil Disimpan!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Data instrumen ini telah masuk ke sistem. Tim binaJourney akan menggunakan profil ini untuk menentukan pairing Sahabat Safar terbaik bagi Anda.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <p className="font-bold text-navy-900 border-b border-slate-200 pb-2">Ringkasan Profil Anda:</p>
              <div className="flex justify-between"><span className="text-slate-500">Gender & Generasi:</span><span className="font-semibold text-navy-900">{layer1.gender || "-"} · {getGenerationLabel(layer1.birthYear) || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kota Domisili:</span><span className="font-semibold text-navy-900">{layer1.city || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Perusahaan:</span><span className="font-semibold text-navy-900">{layer1.company || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status Test:</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Terverifikasi Selesai</span></div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => { setSubmitted(false); setActiveStep(1); }}
                className="rounded-xl h-10 text-xs font-bold border-slate-200"
              >
                Edit Jawaban
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-navy-900 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-6 h-10"
              >
                Ke Dashboard
              </Button>
            </div>
          </Card>
        )}

      </main>
    </ParticipantLayout>
  );
}
