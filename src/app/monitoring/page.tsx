"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckpointCard } from "@/components/domain/CheckpointCard";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

interface MonthlyReviewItem {
  id?: string;
  monthNumber: 1 | 2 | 3;
  status: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  participantNote: string;
  coachNote?: string;
}

export default function MonitoringPage() {
  const supabase = createClient();
  const [selectedMonth, setSelectedMonth] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"ON_TRACK" | "NEED_SUPPORT">("ON_TRACK");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<Record<number, MonthlyReviewItem>>({
    1: { monthNumber: 1, status: "NOT_FILLED", participantNote: "" },
    2: { monthNumber: 2, status: "NOT_FILLED", participantNote: "" },
    3: { monthNumber: 3, status: "NOT_FILLED", participantNote: "" },
  });

  const [finalReflection, setFinalReflection] = useState("");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflection, setSavedReflection] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("monthly_reviews")
          .select("*")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          const map: Record<number, MonthlyReviewItem> = {
            1: { monthNumber: 1, status: "NOT_FILLED", participantNote: "" },
            2: { monthNumber: 2, status: "NOT_FILLED", participantNote: "" },
            3: { monthNumber: 3, status: "NOT_FILLED", participantNote: "" },
          };

          data.forEach((r) => {
            if (r.month_number >= 1 && r.month_number <= 3) {
              map[r.month_number] = {
                id: r.id,
                monthNumber: r.month_number as 1 | 2 | 3,
                status: r.status,
                participantNote: r.participant_note || "",
                coachNote: r.coach_note || undefined,
              };
            }
          });

          setReviews(map);
          setStatus((map[selectedMonth]?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK"));
          setNote(map[selectedMonth]?.participantNote || "");

          // Load journey for final reflection
          const { data: journey } = await supabase
            .from("journeys")
            .select("id, final_reflection")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (journey) {
            setJourneyId(journey.id);
            setFinalReflection(journey.final_reflection || "");
          }
        }
      } catch (err) {
        console.error("Gagal memuat checkpoint:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [selectedMonth]);

  const handleSelectMonth = (month: 1 | 2 | 3) => {
    setSelectedMonth(month);
    const rev = reviews[month];
    setStatus(rev?.status === "NEED_SUPPORT" ? "NEED_SUPPORT" : "ON_TRACK");
    setNote(rev?.participantNote || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentReview = reviews[selectedMonth];

      const { data, error } = await supabase.from("monthly_reviews").upsert({
        id: currentReview?.id || undefined,
        user_id: user.id,
        month_number: selectedMonth,
        status: status,
        participant_note: note,
        updated_at: new Date().toISOString(),
      }).select().maybeSingle();

      if (!error && data) {
        setReviews((prev) => ({
          ...prev,
          [selectedMonth]: {
            ...prev[selectedMonth],
            id: data.id,
            status,
            participantNote: note,
          },
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Gagal menyimpan checkpoint:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!journeyId) return;
    setSavingReflection(true);
    try {
      const { error } = await supabase
        .from("journeys")
        .update({
          final_reflection: finalReflection,
          updated_at: new Date().toISOString(),
        })
        .eq("id", journeyId);

      if (!error) {
        setSavedReflection(true);
        setTimeout(() => setSavedReflection(false), 2000);
      }
    } catch (err) {
      console.error("Gagal menyimpan refleksi akhir:", err);
    } finally {
      setSavingReflection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/monitoring" pageTitle="Monitoring • Progress Checkpoint 30-60-90 Hari">

      <main className="max-w-dashboard mx-auto px-4 md:px-6 pt-6 space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <CheckpointCard
            monthNumber={1}
            status={reviews[1].status}
            participantNote={reviews[1].participantNote}
            coachNote={reviews[1].coachNote}
            isSelected={selectedMonth === 1}
            onClick={() => handleSelectMonth(1)}
          />
          <CheckpointCard
            monthNumber={2}
            status={reviews[2].status}
            participantNote={reviews[2].participantNote}
            coachNote={reviews[2].coachNote}
            isSelected={selectedMonth === 2}
            onClick={() => handleSelectMonth(2)}
          />
          <CheckpointCard
            monthNumber={3}
            status={reviews[3].status}
            participantNote={reviews[3].participantNote}
            coachNote={reviews[3].coachNote}
            isSelected={selectedMonth === 3}
            onClick={() => handleSelectMonth(3)}
          />
        </div>

        {/* Checkpoint Detail Editor */}
        <Card className="bg-white border-warm-border p-6 space-y-6">
          <CardHeader className="p-0 border-b border-warm-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-navy-900">
                Pemeriksaan Checkpoint Bulan Ke-{selectedMonth}
              </CardTitle>
              <Badge variant={status === "ON_TRACK" ? "success" : "warning"} className="font-semibold">
                {status === "ON_TRACK" ? "On Track" : "Need Support"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-navy-900">
                Bagaimana Anda Menilai Progres Anda Bulan Ini?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStatus("ON_TRACK")}
                  className={`flex-1 p-3 rounded-md border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    status === "ON_TRACK"
                      ? "border-emerald-500 bg-emerald-50 text-status-success"
                      : "border-warm-border bg-white text-gray-600 hover:bg-warm-bg"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" /> On Track
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("NEED_SUPPORT")}
                  className={`flex-1 p-3 rounded-md border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    status === "NEED_SUPPORT"
                      ? "border-amber-500 bg-amber-50 text-status-warning"
                      : "border-warm-border bg-white text-gray-600 hover:bg-warm-bg"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" /> Need Support
                </button>
              </div>
            </div>

            <Textarea
              label="Catatan Refleksi Bulanan Anda"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ceritakan dinamika, kendala, atau hal baik selama sebulan terakhir..."
            />

            <div className="p-4 bg-warm-bg rounded-md border border-warm-border space-y-2">
              <h5 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-accent" /> Catatan Balasan Coach
              </h5>
              <p className="text-xs text-gray-600 italic">
                {reviews[selectedMonth]?.coachNote
                  ? `"${reviews[selectedMonth].coachNote}"`
                  : "Coach belum memberikan balasan untuk checkpoint ini."}
              </p>
            </div>
          </CardContent>

          <CardFooter className="p-0 border-t border-warm-border pt-4 flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={saving} className="font-semibold">
              {saving ? "Menyimpan..." : saved ? "Tersimpan" : "Simpan Checkpoint"}
            </Button>
          </CardFooter>
        </Card>

        {/* Refleksi Akhir Program (90 Hari) */}
        <Card className="bg-white border-warm-border p-6 space-y-4">
          <div className="border-b border-warm-border pb-3">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <span>🎓</span> Refleksi Akhir Program (90 Hari)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tuliskan pembelajaran utama, perubahan nyata yang Anda rasakan, dan komitmen keberlanjutan setelah menyelesaikan 90 hari program.
            </p>
          </div>

          <Textarea
            rows={5}
            value={finalReflection}
            onChange={(e) => setFinalReflection(e.target.value)}
            placeholder="Tuliskan refleksi & komitmen keberlanjutan Anda di sini..."
            className="text-xs"
          />

          <div className="flex items-center justify-between pt-2 border-t border-warm-border">
            <span className="text-[10px] text-gray-400 font-medium">{finalReflection.length} Karakter</span>
            <Button
              variant="outline"
              onClick={handleSaveReflection}
              disabled={savingReflection || !journeyId}
              className="font-bold text-xs bg-navy-900 text-amber-300 hover:bg-black border-none"
            >
              {savingReflection ? "Menyimpan..." : savedReflection ? "✓ Refleksi Tersimpan" : "Simpan Refleksi Akhir"}
            </Button>
          </div>
        </Card>
      </main>
    </ParticipantLayout>
  );
}
