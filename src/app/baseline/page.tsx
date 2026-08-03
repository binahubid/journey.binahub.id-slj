"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Zap,
  Users,
  Award,
  Globe,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Heart,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Check,
  Clock,
  Calendar,
  User,
  Lightbulb,
  Rocket,
  Gift,
  BarChart2,
  Brain,
  Quote,
  ListOrdered,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── SCALE DEFINITIONS & CAPTIONS ──────────────────────────────────────────

const SCALE_CAPTIONS: Record<number, { title: string; desc: string }> = {
  1: { title: "Sangat Jauh", desc: "Sangat jauh dari kondisi yang saya harapkan" },
  2: { title: "Butuh Perhatian", desc: "Masih memerlukan banyak perhatian dan perbaikan" },
  3: { title: "Butuh Perhatian", desc: "Masih memerlukan banyak perhatian dan perbaikan" },
  4: { title: "Mulai Berkembang", desc: "Sudah mulai berkembang tetapi belum konsisten" },
  5: { title: "Mulai Berkembang", desc: "Sudah mulai berkembang tetapi belum konsisten" },
  6: { title: "Cukup Baik", desc: "Sudah cukup baik dan terlihat dalam sebagian besar situasi" },
  7: { title: "Cukup Baik", desc: "Sudah cukup baik dan terlihat dalam sebagian besar situasi" },
  8: { title: "Kebiasaan Konsisten", desc: "Sudah menjadi kebiasaan yang konsisten" },
  9: { title: "Kebiasaan Konsisten", desc: "Sudah menjadi kebiasaan yang konsisten" },
  10: { title: "Kekuatan Utama", desc: "Menjadi kekuatan utama yang terus saya jaga dan tingkatkan" },
};

// ── 50 QUESTIONS & 6 STEPS METADATA ─────────────────────────────────────────

interface QuestionItem {
  id: number;
  text: string;
  area: "spiritual_growth" | "personal_development" | "relationship" | "leadership_excellence" | "community_impact" | "readiness";
}

interface StepMeta {
  stepNum: number;
  areaKey: "spiritual_growth" | "personal_development" | "relationship" | "leadership_excellence" | "community_impact" | "readiness";
  title: string;
  icon: React.ElementType;
  muhasabahText: string;
  questions: QuestionItem[];
}

const BASELINE_STEPS: StepMeta[] = [
  {
    stepNum: 1,
    areaKey: "spiritual_growth",
    title: "Spiritual Growth",
    icon: Compass,
    muhasabahText:
      "Sebelum menjawab bagian ini, berhentilah sejenak. Renungkan hubungan Anda dengan Allah selama beberapa tahun terakhir. Pikirkan ibadah yang selama ini telah menjadi kekuatan Anda. Renungkan pula ibadah, kebiasaan spiritual, atau hubungan dengan Allah yang menurut Anda masih memerlukan perhatian lebih. Tidak perlu memikirkan target perubahan terlebih dahulu. Cukup hadirkan kondisi diri Anda saat ini di hadapan Allah dengan penuh kejujuran.",
    questions: [
      { id: 1, text: "Saya menyadari bahwa tujuan utama hidup saya adalah mencari ridha Allah.", area: "spiritual_growth" },
      { id: 2, text: "Saya memahami bahwa setiap aktivitas dapat bernilai ibadah jika diniatkan karena Allah.", area: "spiritual_growth" },
      { id: 3, text: "Saya secara rutin melakukan muhasabah terhadap kualitas hubungan saya dengan Allah.", area: "spiritual_growth" },
      { id: 4, text: "Saya menjaga shalat wajib tepat waktu dengan penuh kesadaran.", area: "spiritual_growth" },
      { id: 5, text: "Saya memiliki kebiasaan ibadah sunnah secara konsisten.", area: "spiritual_growth" },
      { id: 6, text: "Saya berusaha menjadikan Al-Qur'an dan Sunnah sebagai pedoman dalam mengambil keputusan.", area: "spiritual_growth" },
      { id: 7, text: "Ketika menghadapi masalah, saya lebih mengandalkan tawakal kepada Allah daripada rasa cemas.", area: "spiritual_growth" },
      { id: 8, text: "Nilai-nilai Islam tercermin dalam sikap dan perilaku saya sehari-hari.", area: "spiritual_growth" },
      { id: 9, text: "Saya merasakan kualitas spiritual saya terus bertumbuh.", area: "spiritual_growth" },
    ],
  },
  {
    stepNum: 2,
    areaKey: "personal_development",
    title: "Personal Development",
    icon: Zap,
    muhasabahText:
      "Renungkan perjalanan hidup Anda hingga hari ini. Perhatikan karakter, pola pikir, kebiasaan, sikap, pengetahuan, kemampuan, kompetensi, cara menghadapi tantangan, membuat keputusan, serta proses belajar yang sedang Anda jalani. Adakah bagian dari diri Anda yang selama ini sering menjadi perhatian? Belum perlu memikirkan solusi atau perubahan. Fokuslah pada kondisi Anda saat ini.",
    questions: [
      { id: 10, text: "Saya mengenali kekuatan dan kelemahan diri saya dengan baik.", area: "personal_development" },
      { id: 11, text: "Saya terbuka menerima kritik dan masukan untuk memperbaiki diri.", area: "personal_development" },
      { id: 12, text: "Saya mengetahui kebiasaan yang perlu saya ubah.", area: "personal_development" },
      { id: 13, text: "Saya terus meningkatkan pengetahuan dan kompetensi saya.", area: "personal_development" },
      { id: 14, text: "Saya mampu membuat keputusan dengan bijaksana dalam berbagai situasi.", area: "personal_development" },
      { id: 15, text: "Saya mampu menghadapi tantangan tanpa mudah menyerah.", area: "personal_development" },
      { id: 16, text: "Saya memiliki sikap yang positif dalam menghadapi perubahan.", area: "personal_development" },
      { id: 17, text: "Saya disiplin mengembangkan diri melalui proses belajar yang berkelanjutan.", area: "personal_development" },
      { id: 18, text: "Saya terus berusaha menjadi versi terbaik dari diri saya.", area: "personal_development" },
    ],
  },
  {
    stepNum: 3,
    areaKey: "relationship",
    title: "Relationship",
    icon: Users,
    muhasabahText:
      "Renungkan hubungan Anda dengan orang-orang yang Allah hadirkan dalam kehidupan Anda. Bayangkan pasangan, orang tua, anak, saudara, sahabat, rekan kerja, atasan, bawahan, pelanggan, maupun orang lain yang memiliki hubungan penting dengan Anda. Perhatikan hubungan yang telah berjalan dengan baik maupun hubungan yang masih memerlukan perhatian lebih. Tidak perlu memikirkan bagaimana memperbaikinya terlebih dahulu. Cukup sadari bagaimana kondisi hubungan tersebut saat ini.",
    questions: [
      { id: 19, text: "Saya berusaha memahami kebutuhan dan perasaan orang lain.", area: "relationship" },
      { id: 20, text: "Saya menjaga komunikasi yang baik dengan orang-orang di sekitar saya.", area: "relationship" },
      { id: 21, text: "Saya mampu meminta maaf ketika melakukan kesalahan.", area: "relationship" },
      { id: 22, text: "Saya mudah memaafkan kesalahan orang lain.", area: "relationship" },
      { id: 23, text: "Saya meluangkan waktu berkualitas bersama keluarga.", area: "relationship" },
      { id: 24, text: "Saya membangun hubungan profesional yang baik dengan atasan, bawahan, rekan kerja, dan pelanggan.", area: "relationship" },
      { id: 25, text: "Orang lain merasa nyaman ketika berinteraksi dengan saya.", area: "relationship" },
      { id: 26, text: "Saya dikenal sebagai pribadi yang dapat dipercaya.", area: "relationship" },
      { id: 27, text: "Kehadiran saya membawa pengaruh positif bagi hubungan di sekitar saya.", area: "relationship" },
    ],
  },
  {
    stepNum: 4,
    areaKey: "leadership_excellence",
    title: "Leadership & Professional Excellence",
    icon: Award,
    muhasabahText:
      "Renungkan amanah yang Allah titipkan kepada Anda. Baik sebagai pemimpin, profesional, pengusaha, pekerja, maupun peran lainnya. Pikirkan bagaimana Anda menjalankan amanah tersebut setiap hari. Bagian mana yang sudah menjadi kekuatan Anda? Bagian mana yang menurut Anda masih perlu dikembangkan?",
    questions: [
      { id: 28, text: "Saya memandang pekerjaan sebagai amanah dari Allah.", area: "leadership_excellence" },
      { id: 29, text: "Saya memahami tujuan dari pekerjaan atau peran yang saya jalankan.", area: "leadership_excellence" },
      { id: 30, text: "Saya memberikan kontribusi terbaik dalam setiap tanggung jawab.", area: "leadership_excellence" },
      { id: 31, text: "Saya bekerja dengan integritas meskipun tidak diawasi.", area: "leadership_excellence" },
      { id: 32, text: "Saya menjaga kualitas hasil kerja saya.", area: "leadership_excellence" },
      { id: 33, text: "Saya berani mengambil tanggung jawab atas keputusan saya.", area: "leadership_excellence" },
      { id: 34, text: "Saya menjadi teladan melalui perilaku sehari-hari.", area: "leadership_excellence" },
      { id: 35, text: "Saya membantu orang lain berkembang.", area: "leadership_excellence" },
      { id: 36, text: "Kehadiran saya memberikan nilai tambah bagi organisasi.", area: "leadership_excellence" },
    ],
  },
  {
    stepNum: 5,
    areaKey: "community_impact",
    title: "Community Impact",
    icon: Globe,
    muhasabahText:
      "Renungkan manfaat yang telah Anda berikan kepada lingkungan sekitar. Pikirkan keluarga besar, organisasi, komunitas, lingkungan sekitar, masyarakat, maupun umat. Apakah kehadiran Anda telah membawa manfaat bagi orang lain? Adakah kontribusi yang selama ini ingin Anda tingkatkan? Jawablah berdasarkan kondisi Anda saat ini.",
    questions: [
      { id: 37, text: "Saya merasa bertanggung jawab untuk memberi manfaat kepada orang lain.", area: "community_impact" },
      { id: 38, text: "Saya percaya hidup yang bermakna adalah hidup yang bermanfaat.", area: "community_impact" },
      { id: 39, text: "Saya ingin memberikan amal jariyah yang terus memberikan manfaat.", area: "community_impact" },
      { id: 40, text: "Saya terlibat dalam kegiatan sosial, dakwah, pendidikan, atau pelayanan masyarakat.", area: "community_impact" },
      { id: 41, text: "Saya senang berbagi ilmu, pengalaman, atau rezeki.", area: "community_impact" },
      { id: 42, text: "Saya berusaha menjadi solusi bagi permasalahan di sekitar saya.", area: "community_impact" },
      { id: 43, text: "Orang lain merasakan manfaat dari keberadaan saya.", area: "community_impact" },
      { id: 44, text: "Saya menginspirasi orang lain untuk melakukan kebaikan.", area: "community_impact" },
      { id: 45, text: "Saya ingin terus memperluas dampak positif yang saya berikan.", area: "community_impact" },
    ],
  },
  {
    stepNum: 6,
    areaKey: "readiness",
    title: "Kesiapan Memasuki Perjalanan Transformasi",
    icon: Heart,
    muhasabahText:
      "Langkah terakhir ini mengukur kesiapan dan komitmen hati Anda untuk menjalani Spiritual Leadership Journey selama 90 hari ke depan.",
    questions: [
      { id: 46, text: "Saya menyadari bahwa saya selalu memiliki ruang untuk bertumbuh menjadi pribadi yang lebih baik.", area: "readiness" },
      { id: 47, text: "Saya memahami pentingnya memiliki arah yang jelas dalam proses perubahan diri.", area: "readiness" },
      { id: 48, text: "Saya siap membuka diri terhadap proses refleksi, pembelajaran, dan masukan selama mengikuti program ini.", area: "readiness" },
      { id: 49, text: "Saya bersedia keluar dari kebiasaan lama apabila diperlukan untuk menjadi pribadi yang lebih baik.", area: "readiness" },
      { id: 50, text: "Saya berkomitmen mengikuti seluruh proses Spiritual Leadership Journey dengan sungguh-sungguh.", area: "readiness" },
    ],
  },
];

export default function BaselinePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0); // 0 to 5 for steps, 6 for summary
  const [isIntro, setIsIntro] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // ── LOAD ASSESSMENT DATA ──────────────────────────────────────────────────

  const loadBaselineData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setErrorMessage(null);

      // Restore from localStorage first as instant fallback
      let localAnswers: Record<number, number> = {};
      try {
        const stored = localStorage.getItem(`baseline_answers_draft:${user.id}`);
        if (stored) localAnswers = JSON.parse(stored);
      } catch {}

      // Check existing assessment
      let { data: assessment, error: assessmentError } = await supabase.from("baseline_assessments")
        .select("*").eq("user_id", user.id).maybeSingle();
      if (assessmentError) throw assessmentError;

      if (!assessment) {
        // Create new assessment entry
        const { data: newAss, error } = await supabase.from("baseline_assessments")
          .insert({ user_id: user.id })
          .select().single();
        if (!error && newAss) {
          assessment = newAss;
        } else {
          // Retry query in case of RLS / concurrent insert
          const { data: retryAss, error: retryError } = await supabase.from("baseline_assessments")
            .select("*").eq("user_id", user.id).maybeSingle();
          if (retryError) throw retryError;
          if (retryAss) assessment = retryAss;
          else throw error || new Error("Assessment baseline tidak dapat dibuat.");
        }
      }

      if (assessment) {
        setAssessmentId(assessment.id);
        setIsCompleted(assessment.completed || false);

        // Fetch existing answers
        const { data: ansList, error: answersError } = await supabase.from("baseline_answers")
          .select("question_number, score")
          .eq("assessment_id", assessment.id);
        if (answersError) throw answersError;

        const aMap: Record<number, number> = { ...localAnswers };
        (ansList || []).forEach((a: any) => {
          aMap[a.question_number] = a.score;
        });
        setAnswersMap(aMap);

        if (assessment.completed) {
          setIsIntro(false);
          setCurrentStepIndex(6); // Summary screen
        }
      }
    } catch (err) {
      console.error("Gagal memuat baseline assessment:", err);
      setErrorMessage("Baseline belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.");
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => { loadBaselineData(); }, [loadBaselineData]);

  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answersMapRef = useRef<Record<number, number>>({});
  useEffect(() => { answersMapRef.current = answersMap; }, [answersMap]);
  useEffect(() => () => {
    if (saveDebounceTimerRef.current) clearTimeout(saveDebounceTimerRef.current);
  }, []);

  // Jeda Refleksi expand/collapse state
  const [isRefleksiExpanded, setIsRefleksiExpanded] = useState(true);

  // Scroll to top & reset refleksi expanded when step changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsRefleksiExpanded(true);
  }, [currentStepIndex, isIntro]);

  // Batch save current answers map to Supabase
  const batchSaveAnswersToSupabase = async (mapToSave?: Record<number, number>) => {
    try {
      setSaveStatus("saving");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let currentAssId = assessmentId;
      if (!currentAssId) {
        const { data: assData } = await supabase.from("baseline_assessments")
          .select("id").eq("user_id", user.id).maybeSingle();
        if (assData?.id) currentAssId = assData.id;
      }
      if (!currentAssId) return;

      const targetMap = mapToSave || answersMapRef.current;
      const allQuestions = BASELINE_STEPS.flatMap(step => step.questions);
      const answerPayload = Object.entries(targetMap).map(([qNumStr, scoreVal]) => {
        const qNum = parseInt(qNumStr, 10);
        const qObj = allQuestions.find(q => q.id === qNum);
        return {
          assessment_id: currentAssId,
          user_id: user.id,
          question_number: qNum,
          area: qObj?.area || "baseline",
          score: scoreVal,
          updated_at: new Date().toISOString(),
        };
      });

      if (answerPayload.length > 0) {
        const { error } = await supabase.from("baseline_answers").upsert(answerPayload, {
          onConflict: "assessment_id,question_number",
        });
        if (error) throw error;
      }
      setSaveStatus("saved");
    } catch (err) {
      console.error("Batch autosave error:", err);
      setSaveStatus("error");
      setErrorMessage("Jawaban tersimpan di perangkat, tetapi belum tersinkron ke server.");
    }
  };

  // ── AUTO-SAVE ANSWER WITH DEBOUNCE & BATCH ─────────────────────────────────

  const handleSelectScore = (q: QuestionItem, scoreVal: number) => {
    // 1. Instant local state update
    const updatedMap = { ...answersMap, [q.id]: scoreVal };
    setAnswersMap(updatedMap);

    // 2. Instant localStorage cache for offline/reload safety
    try {
      if (userId) localStorage.setItem(`baseline_answers_draft:${userId}`, JSON.stringify(updatedMap));
    } catch {}

    // 3. Debounced batch save to Supabase (1.5s debounce to minimize DB calls during rapid clicking)
    if (saveDebounceTimerRef.current) clearTimeout(saveDebounceTimerRef.current);
    saveDebounceTimerRef.current = setTimeout(() => {
      batchSaveAnswersToSupabase(updatedMap);
    }, 1500);
  };

  // ── COMPLETE ASSESSMENT ───────────────────────────────────────────────────

  const handleCompleteAssessment = async () => {
    const missingQuestions = BASELINE_STEPS.flatMap(step => step.questions).filter(question => answersMap[question.id] === undefined);
    if (missingQuestions.length > 0) {
      const firstMissingStep = BASELINE_STEPS.findIndex(step => step.questions.some(question => answersMap[question.id] === undefined));
      setErrorMessage(`Masih ada ${missingQuestions.length} pernyataan yang belum dijawab.`);
      setCurrentStepIndex(Math.max(0, firstMissingStep));
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let currentAssId = assessmentId;
        if (!currentAssId) {
          const { data: assData } = await supabase.from("baseline_assessments")
            .select("id").eq("user_id", user.id).maybeSingle();
          if (assData?.id) {
            currentAssId = assData.id;
          } else {
            const { data: newAss, error: newAssessmentError } = await supabase.from("baseline_assessments")
              .insert({ user_id: user.id })
              .select("id").single();
            if (newAssessmentError) throw newAssessmentError;
            if (newAss?.id) currentAssId = newAss.id;
          }
        }

        if (currentAssId) {
          // 1. Batch save all baseline answers to Supabase
          const allQuestions = BASELINE_STEPS.flatMap(step => step.questions);
          const answerPayload = Object.entries(answersMap).map(([qNumStr, scoreVal]) => {
            const qNum = parseInt(qNumStr, 10);
            const qObj = allQuestions.find(q => q.id === qNum);
            return {
              assessment_id: currentAssId,
              user_id: user.id,
              question_number: qNum,
              area: qObj?.area || "Komitmen Akhir",
              score: scoreVal,
              updated_at: new Date().toISOString(),
            };
          });

          if (answerPayload.length > 0) {
            const { error: ansErr } = await supabase.from("baseline_answers").upsert(answerPayload, {
              onConflict: "assessment_id,question_number",
            });
            if (ansErr) throw ansErr;
          }

          // 2. Update baseline_assessments completed status
          const { error: assErr } = await supabase.from("baseline_assessments").update({
            completed: true,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", currentAssId);
          if (assErr) throw assErr;
          setAssessmentId(currentAssId);
          setIsCompleted(true);
          setCurrentStepIndex(6);
          if (userId) localStorage.removeItem(`baseline_answers_draft:${userId}`);
        } else {
          throw new Error("Assessment baseline tidak ditemukan.");
        }
      } else {
        throw new Error("Sesi login telah berakhir.");
      }
    } catch (err) {
      console.error("Gagal menyelesaikan baseline:", err);
      setErrorMessage("Baseline belum berhasil dikirim. Jawaban Anda tetap tersimpan dan dapat dicoba kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── SCORE CALCULATIONS FOR SUMMARY ────────────────────────────────────────

  const calculateAreaScores = () => {
    const scores: Record<string, number> = {};
    BASELINE_STEPS.forEach(step => {
      let sum = 0;
      let count = 0;
      step.questions.forEach(q => {
        const val = answersMap[q.id];
        if (val !== undefined) {
          sum += val;
          count += 1;
        }
      });
      const maxPossible = count * 10;
      scores[step.areaKey] = maxPossible > 0 ? Math.round((sum / maxPossible) * 100) : 0;
    });
    return scores;
  };

  const answeredCount = Object.keys(answersMap).length;
  const currentStep = BASELINE_STEPS[Math.min(currentStepIndex, 5)];
  const currentStepAnswered = currentStep.questions.filter(question => answersMap[question.id] !== undefined).length;
  const currentStepComplete = currentStepAnswered === currentStep.questions.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/baseline" pageTitle="Baseline Self-Discovery">
      <main className="max-w-7xl w-full mx-auto pt-6 pb-20 font-sans text-slate-800 space-y-6">
        {errorMessage && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <span className="flex-1">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} aria-label="Tutup pesan" className="text-rose-400 hover:text-rose-700">×</button>
          </div>
        )}

        {/* ─── INTRO SCREEN (MATCHING USER SCREENSHOT DESIGN) ─────────────── */}
        {isIntro ? (
          <div className="space-y-5">
            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

              {/* ─── LEFT COLUMN (75% / col-span-8) ───────────────────────── */}
              <div className="xl:col-span-8 space-y-6">

                {/* HERO CARD WITH WEBP ILLUSTRATION */}
                <Card className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xs border border-slate-200/70 relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                    
                    {/* Left Text Info */}
                    <div className="space-y-4 max-w-md">
                      {/* Icon + Title Aligned Horizontally */}
                      <div className="flex items-start gap-3.5">
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/80 shadow-2xs mt-0.5">
                          <Brain className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight leading-tight">
                            Baseline<br />Self-Discovery
                          </h1>
                          <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                            TAHAP MUHASABAH • KONDISI DIRI SAAT INI
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Muhasabah yang jujur adalah langkah awal perubahan. Kenali kondisimu saat ini agar perjalanan 90 hari ini lebih terarah dan bermakna.
                      </p>

                      {/* Ayat Quran Quote Card */}
                      <div className="bg-[#FFFDF3] p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3 mt-2">
                        <span className="text-amber-500 text-2xl font-serif leading-none select-none">“</span>
                        <div className="space-y-1 text-xs">
                          <p className="text-slate-700 italic font-serif leading-relaxed">
                            &ldquo;Wahai orang-orang yang beriman, bertakwalah kepada Allah dan hendaklah setiap diri memperhatikan apa yang telah diperbuatnya untuk hari esok (akhirat).&rdquo;
                          </p>
                          <p className="text-[10px] font-bold text-amber-800 font-sans">
                            — QS. Al-Hasyr: 18
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right WebP Illustration (Enlarged) */}
                    <img
                      src="/ilustration-baseline.webp"
                      alt="Baseline Illustration"
                      className="w-48 sm:w-64 lg:w-72 h-auto object-contain shrink-0 self-center sm:self-auto drop-shadow-md"
                    />

                  </div>
                </Card>

                {/* SKALA PENILAIAN 1-10 CARD */}
                <Card className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xs border border-slate-200/70 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100/80">
                      <BarChart2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#071A33]">
                        Skala Penilaian (1–10)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pilih angka yang paling menggambarkan kondisimu saat ini.
                      </p>
                    </div>
                  </div>

                  {/* 6 Stepper Pills */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1 text-center">
                    {/* Item 1 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-rose-50/40 border border-rose-100">
                      <div className="h-9 w-9 rounded-full bg-rose-50 border-2 border-rose-400 text-rose-600 font-extrabold text-xs flex items-center justify-center shadow-xs">
                        1
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        Sangat jauh dari harapan
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-amber-50/40 border border-amber-100">
                      <div className="h-9 px-3 rounded-full bg-amber-50 border-2 border-amber-400 text-amber-800 font-extrabold text-xs flex items-center justify-center shadow-xs">
                        2 – 3
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        Masih perlu banyak perhatian
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-amber-50/30 border border-amber-100">
                      <div className="h-9 px-3 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-900 font-extrabold text-xs flex items-center justify-center shadow-xs">
                        4 – 5
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        Mulai berkembang, belum konsisten
                      </span>
                    </div>

                    {/* Item 4 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-emerald-50/30 border border-emerald-100">
                      <div className="h-9 px-3 rounded-full bg-emerald-50 border-2 border-emerald-400 text-emerald-800 font-extrabold text-xs flex items-center justify-center shadow-xs">
                        6 – 7
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        Sudah cukup baik sebagian besar
                      </span>
                    </div>

                    {/* Item 5 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div className="h-9 px-3 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-extrabold text-xs flex items-center justify-center shadow-xs">
                        8 – 9
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        Sudah jadi kebiasaan konsisten
                      </span>
                    </div>

                    {/* Item 6 */}
                    <div className="flex flex-col items-center space-y-2 p-2 rounded-2xl bg-emerald-100/40 border border-emerald-200">
                      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        10
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                        Kekuatan utama yang dijaga
                      </span>
                    </div>
                  </div>
                </Card>

                {/* METADATA INFO BAR & START BUTTON */}
                <Card className="bg-white p-5 rounded-3xl shadow-2xs border border-slate-200/70 flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    {/* Item 1: Estimasi Waktu */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block leading-none">Estimasi waktu</span>
                        <span className="text-xs font-black text-[#071A33]">10–15 Menit</span>
                      </div>
                    </div>

                    {/* Item 2: Jumlah Pertanyaan */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        <ListOrdered className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block leading-none">Jumlah pertanyaan</span>
                        <span className="text-xs font-black text-[#071A33]">50 Pernyataan</span>
                      </div>
                    </div>

                    {/* Item 3: Durasi Program */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block leading-none">Durasi program</span>
                        <span className="text-xs font-black text-[#071A33]">90 Hari Perjalanan</span>
                      </div>
                    </div>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={() => setIsIntro(false)}
                    className="bg-[#071A33] hover:bg-slate-900 text-white font-extrabold text-xs rounded-2xl px-8 h-12 w-full sm:w-auto shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    Mulai Muhasabah
                    <ArrowRight className="h-4 w-4 text-amber-300" />
                  </Button>
                </Card>

              </div>

              {/* ─── RIGHT COLUMN (25% / col-span-4) ──────────────────────── */}
              <div className="xl:col-span-4 space-y-6">

                {/* CARD 1: SEBELUM MEMULAI */}
                <Card className="bg-white p-6 rounded-3xl shadow-2xs border border-slate-200/70 space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#071A33]">
                      Sebelum memulai
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-[#071A33]">Jujur pada diri sendiri</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Jawabanmu tidak dinilai benar atau salah. Ini untuk dirimu sendiri.
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-[#071A33]">Luangkan waktu tenang</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Cari waktu terbaik agar kamu bisa muhasabah dengan fokus.
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                        <Rocket className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-[#071A33]">Mulai perjalanan perubahan</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Hasil muhasabah ini akan menjadi peta transformasi 90 hari ke depan.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* CARD 2: APA YANG AKAN KAMU DAPATKAN? */}
                <Card className="bg-white p-6 rounded-3xl shadow-2xs border border-slate-200/70 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                        <Gift className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-extrabold text-[#071A33]">
                        Apa yang akan kamu dapatkan?
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Memahami kondisi dirimu saat ini</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Mengetahui area yang perlu diperkuat</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Menjadi dasar pembuatan Target 90 Hari</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Membantu coach memahami dirimu lebih baik</span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Base Image Layer (z-0, Opacity 10%) */}
                  <img
                    src="/ilustration-baseline-2.webp"
                    alt="Baseline Reward Illustration"
                    className="w-48 sm:w-56 md:w-60 h-auto object-contain absolute -right-1 -bottom-1 opacity-40 pointer-events-none z-0"
                  />
                </Card>

              </div>

            </div>
          </div>
        ) : currentStepIndex === 6 ? (

          /* ─── SUMMARY RESULT SCREEN ───────────────────────────────────── */
          <Card className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xs space-y-6 border-none">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold mb-1">
                  ✓ Self-Discovery Selesai
                </Badge>
                <h1 className="text-xl sm:text-2xl font-black text-navy-900">
                  Ringkasan Skor Baseline Self-Discovery
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Titik awal kondisi diri Anda sebelum memasuki Personal Transformation Project.
                </p>
              </div>
            </div>

            {/* Skor Area Bar Display */}
            <div className="space-y-4 pt-1">
              {(() => {
                const areaScores = calculateAreaScores();
                return BASELINE_STEPS.filter(s => s.areaKey !== "readiness").map(step => {
                  const score = areaScores[step.areaKey] || 0;
                  const Icon = step.icon;
                  return (
                    <div key={step.areaKey} className="bg-slate-50 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-900 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-amber-600" />
                          {step.title}
                        </span>
                        <span className="text-sm font-black text-navy-900">{score}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(5, score)}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">💡 Langkah Selanjutnya:</span>
              <p className="leading-relaxed">
                Skor awal ini akan tersimpan sebagai acuan Journey Health Score di Monitoring. Gunakan gambaran kondisi diri ini saat merumuskan Niat & Target 90 Hari di PTP.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                onClick={() => setCurrentStepIndex(0)}
                variant="outline"
                className="text-xs font-semibold rounded-xl h-10 border-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Tinjau Kembali Jawaban
              </Button>
              <Button
                onClick={() => router.push("/journey")}
                className="bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-10 px-6 shadow-xs"
              >
                Lanjut ke PTP (Target 90 Hari)
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>

        ) : (

          /* ─── STEP QUESTION WIZARD (STEPS 1 to 6) ────────────────────────── */
          <div className="space-y-6">

            {/* Header & Pacing Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-2xs space-y-3 border-none">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-700 uppercase tracking-wider">
                  Langkah {currentStep.stepNum} dari 6: {currentStep.title}
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : saveStatus === "error" ? "Belum tersinkron" : "Siap"}
                  <span>Progres: {answeredCount} / 50</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(answeredCount / 50) * 100}%` }}
                />
              </div>
            </div>

            {/* Pause Card (Paragraf Pengantar Reflektif / Muhasabah - Expandable / Collapsible with Solid Color) */}
            <div className="bg-[#071A33] border-l-4 border-amber-400 rounded-2xl overflow-hidden transition-all shadow-xs">
              <button
                type="button"
                onClick={() => setIsRefleksiExpanded((prev) => !prev)}
                className="w-full p-4 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  Jeda Refleksi — {currentStep.title}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0">
                  <span>{isRefleksiExpanded ? "Sembunyikan" : "Tampilkan Refleksi"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isRefleksiExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isRefleksiExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-700/60 bg-[#071A33] space-y-2 animate-fadeIn">
                  <p className="text-xs sm:text-sm text-slate-100 italic leading-relaxed">
                    &ldquo;{currentStep.muhasabahText}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {currentStep.questions.map((q) => {
                const selectedScore = answersMap[q.id];
                const activeCaption = selectedScore ? SCALE_CAPTIONS[selectedScore] : null;

                // Special Treatment for Item #50 (Commitment)
                if (q.id === 50) {
                  return (
                    <Card key={q.id} className="bg-gradient-to-br from-[#071A33] to-navy-900 text-white p-6 rounded-3xl space-y-4 border-none shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          50
                        </div>
                        <div className="space-y-1">
                          <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px]">
                            Komitmen Akhir
                          </Badge>
                          <h4 className="text-sm sm:text-base font-extrabold leading-snug text-white">
                            {q.text}
                          </h4>
                        </div>
                      </div>

                      {/* 1-10 Segmented Scale */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isSelected = selectedScore === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleSelectScore(q, num)}
                                className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                                  isSelected
                                    ? "bg-amber-400 text-navy-950 font-black shadow-md scale-105"
                                    : "bg-white/10 hover:bg-white/20 text-slate-200"
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        {activeCaption && (
                          <p className="text-xs text-amber-300 font-medium text-center pt-1 animate-fadeIn">
                            🎯 {activeCaption.title}: &ldquo;{activeCaption.desc}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Commitment CTA Button */}
                      {selectedScore && (
                        <div className="pt-3 flex justify-center">
                          <Button
                            onClick={handleCompleteAssessment}
                            disabled={submitting}
                            className="bg-amber-400 hover:bg-amber-300 text-navy-950 text-xs font-extrabold rounded-xl px-8 h-11 shadow-lg w-full sm:w-auto"
                          >
                            {submitting ? "Menyimpan..." : "Saya Siap Memulai Perjalanan 90 Hari"}
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                }

                return (
                  <Card key={q.id} className="bg-white p-5 rounded-2xl shadow-2xs space-y-3 border-none">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-extrabold text-slate-400 font-mono mt-0.5">
                        #{q.id}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-navy-900 leading-snug">
                        {q.text}
                      </p>
                    </div>

                    {/* 1-10 Segmented Scale Control */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = selectedScore === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleSelectScore(q, num)}
                              className={`h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                                isSelected
                                  ? "bg-amber-500 text-white shadow-xs font-black scale-105"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      {/* Dynamic Scale Caption */}
                      {activeCaption && (
                        <p className="text-[11px] text-amber-700 font-medium pt-0.5 animate-fadeIn">
                          • {activeCaption.title}: {activeCaption.desc}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Bottom Wizard Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStepIndex === 0) setIsIntro(true);
                  else setCurrentStepIndex(prev => prev - 1);
                }}
                className="text-xs font-bold rounded-xl h-10 px-5 border-slate-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>

              {currentStepIndex < 5 && (
                <Button
                  onClick={() => {
                    if (!currentStepComplete) {
                      setErrorMessage(`Jawab semua pernyataan di bagian ${currentStep.title} sebelum melanjutkan.`);
                      return;
                    }
                    setErrorMessage(null);
                    setCurrentStepIndex(prev => prev + 1);
                  }}
                  className="bg-[#071A33] hover:bg-slate-900 text-amber-300 text-xs font-bold rounded-xl h-10 px-6 shadow-xs"
                >
                  Langkah Berikutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

          </div>
        )}

      </main>
    </ParticipantLayout>
  );
}
