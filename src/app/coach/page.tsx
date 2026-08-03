"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ParticipantMonitoringRow } from "@/components/domain/ParticipantMonitoringRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MessageSquare, AlertTriangle, ShieldCheck, User, Check } from "lucide-react";
import { JourneyStatus } from "@/types/slj";
import { evaluateParticipantAlert } from "@/lib/monitoring";
import { createClient } from "@/lib/supabase/client";

interface ParticipantData {
  id: string;
  fullName: string;
  dayCount: number;
  journeyStatus: JourneyStatus;
  habitCompletionPercent: number;
  lastHabitLogDaysAgo: number;
  lastActiveDaysAgo: number;
  lastCheckpointStatus?: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  coachRepliedDaysAgo?: number;
  muhasabah?: string;
  niat?: string;
  mainTarget?: string;
}

export default function CoachViewPage() {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coachNoteInput, setCoachNoteInput] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);

  useEffect(() => {
    async function loadCoachData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch participants assigned to coach, or all participants if current user is admin/coach
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, created_at, start_date")
          .eq("role", "participant");

        if (!profiles || profiles.length === 0) {
          setParticipants([]);
          return;
        }

        const userIds = profiles.map((p) => p.user_id);

        const { data: journeys } = await supabase
          .from("journeys")
          .select("*")
          .in("user_id", userIds);

        const { data: habitLogs } = await supabase
          .from("habit_logs")
          .select("user_id, date, completed")
          .in("user_id", userIds);

        const { data: reviews } = await supabase
          .from("monthly_reviews")
          .select("*")
          .in("user_id", userIds);

        const now = new Date();

        const mapped: ParticipantData[] = profiles.map((p) => {
          const journey = (journeys || []).find((j) => j.user_id === p.user_id);
          const pLogs = (habitLogs || []).filter((l) => l.user_id === p.user_id);
          const pReviews = (reviews || []).filter((r) => r.user_id === p.user_id);

          // Day count
          let dayCount = 1;
          if (p.start_date) {
            const start = new Date(p.start_date);
            dayCount = Math.min(Math.max(Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1), 90);
          }

          // Habit completion % (last 7 days)
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const recentLogs = pLogs.filter((l) => l.date >= sevenDaysAgo && l.completed);
          const habitCompletionPercent = Math.min(Math.round((recentLogs.length / 7) * 100), 100);

          // Last habit log days ago
          let lastHabitLogDaysAgo = 999;
          if (pLogs.length > 0) {
            const sorted = [...pLogs].sort((a, b) => b.date.localeCompare(a.date));
            const lastLogDate = new Date(sorted[0].date);
            lastHabitLogDaysAgo = Math.floor((now.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Last active
          const lastActive = journey?.updated_at ? new Date(journey.updated_at) : new Date(p.created_at);
          const lastActiveDaysAgo = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

          // Checkpoint
          let lastCheckpointStatus: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED" = "NOT_FILLED";
          let coachRepliedDaysAgo: number | undefined = undefined;

          if (pReviews.length > 0) {
            const latestReview = [...pReviews].sort((a, b) => b.month_number - a.month_number)[0];
            lastCheckpointStatus = latestReview.status;
            if (latestReview.coach_replied_at) {
              const replyDate = new Date(latestReview.coach_replied_at);
              coachRepliedDaysAgo = Math.floor((now.getTime() - replyDate.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          return {
            id: p.user_id,
            fullName: p.full_name || "Peserta",
            dayCount,
            journeyStatus: (journey?.status as JourneyStatus) || JourneyStatus.ACTIVE,
            habitCompletionPercent,
            lastHabitLogDaysAgo,
            lastActiveDaysAgo,
            lastCheckpointStatus,
            coachRepliedDaysAgo,
            muhasabah: journey?.muhasabah || undefined,
            niat: journey?.niat || undefined,
            mainTarget: journey?.main_target || undefined,
          };
        });

        setParticipants(mapped);
        if (mapped.length > 0 && !selectedId) {
          setSelectedId(mapped[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat data coach:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCoachData();
  }, [selectedId]);

  // Priority sorting & search filter
  const evaluatedParticipants = participants
    .filter((p) => p.fullName.toLowerCase().includes(search.toLowerCase()))
    .map((p) => ({
      ...p,
      evaluated: evaluateParticipantAlert(p),
    }))
    .sort((a, b) => {
      if (a.evaluated.flag && !b.evaluated.flag) return -1;
      if (!a.evaluated.flag && b.evaluated.flag) return 1;
      return 0;
    });

  const selectedParticipant = evaluatedParticipants.find((p) => p.id === selectedId);

  const handleSendNote = async () => {
    if (!coachNoteInput.trim() || !selectedParticipant) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upsert coach note into latest monthly_review for this participant
      const { data: reviews } = await supabase
        .from("monthly_reviews")
        .select("id")
        .eq("user_id", selectedParticipant.id)
        .order("month_number", { ascending: false })
        .limit(1);

      if (reviews && reviews.length > 0) {
        await supabase
          .from("monthly_reviews")
          .update({
            coach_note: coachNoteInput,
            coach_replied_at: new Date().toISOString(),
          })
          .eq("id", reviews[0].id);
      } else {
        await supabase.from("monthly_reviews").insert({
          user_id: selectedParticipant.id,
          month_number: 1,
          status: "ON_TRACK",
          coach_note: coachNoteInput,
          coach_replied_at: new Date().toISOString(),
        });
      }

      setNoteSent(true);
      setCoachNoteInput("");
      setTimeout(() => setNoteSent(false), 3000);
    } catch (err) {
      console.error("Gagal mengirim catatan coach:", err);
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
    <div className="min-h-screen bg-warm-bg text-navy-900 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-warm-border sticky top-0 z-40">
        <div className="max-w-dashboard mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="shrink-0 gap-1 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard Peserta</span>
              </Button>
            </Link>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <h1 className="truncate text-sm font-bold text-navy-900 sm:text-lg">
              <span className="sm:hidden">Coach Monitoring</span><span className="hidden sm:inline">Coach Monitoring Dashboard</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-dashboard mx-auto px-4 md:px-6 pt-6 space-y-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Participant List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-grow">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama peserta..."
                  className="pl-9 bg-white border-warm-border text-xs"
                />
              </div>
            </div>

            {evaluatedParticipants.length === 0 ? (
              <Card className="bg-white border-warm-border p-8 text-center">
                <p className="text-xs text-gray-400 italic">Belum ada peserta terdaftar.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {evaluatedParticipants.map((item) => (
                  <ParticipantMonitoringRow
                    key={item.id}
                    id={item.id}
                    fullName={item.fullName}
                    dayCount={item.dayCount}
                    journeyStatus={item.journeyStatus}
                    habitCompletionPercent={item.habitCompletionPercent}
                    lastCheckpointStatus={item.lastCheckpointStatus}
                    lastActiveAt={`${item.lastActiveDaysAgo} hari lalu`}
                    flag={item.evaluated.flag}
                    onClick={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Participant Detail & Coach Feedback */}
          <div className="lg:col-span-5 space-y-4">
            {selectedParticipant ? (
              <Card className="bg-white border-warm-border p-6 space-y-6 sticky top-20">
                <div className="flex items-center space-x-3 border-b border-warm-border pb-4">
                  <div className="h-12 w-12 rounded-full bg-navy-900 text-accent font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                    {selectedParticipant.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                      {selectedParticipant.fullName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Hari ke-{selectedParticipant.dayCount} dari 90 • Status: {selectedParticipant.journeyStatus}
                    </p>
                  </div>
                </div>

                {/* Muhasabah & Niat Overview */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Hasil Muhasabah:</span>
                    <p className="p-3 bg-warm-bg rounded-md border border-warm-border text-navy-900 italic">
                      &ldquo;{selectedParticipant.muhasabah || "Belum diisi"}&rdquo;
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Niat Perubahan:</span>
                    <p className="p-3 bg-amber-50/60 rounded-md border border-amber-200/60 text-navy-900 font-serif italic">
                      &ldquo;{selectedParticipant.niat || "Belum diisi"}&rdquo;
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Target Utama (90 Hari):</span>
                    <p className="p-3 bg-warm-bg rounded-md border border-warm-border text-navy-900 font-medium">
                      {selectedParticipant.mainTarget || "Belum diisi"}
                    </p>
                  </div>
                </div>

                {/* Form Catatan Coach */}
                <div className="space-y-3 pt-4 border-t border-warm-border">
                  <label className="block text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-accent" /> Berikan Catatan / Feedback Coach
                  </label>

                  {noteSent && (
                    <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md font-semibold flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600" /> Catatan pendampingan berhasil dikirimkan ke peserta!
                    </div>
                  )}

                  <Textarea
                    rows={4}
                    value={coachNoteInput}
                    onChange={(e) => setCoachNoteInput(e.target.value)}
                    placeholder="Tuliskan apresiasi, pengingat lembut, atau arahan untuk peserta ini..."
                    className="text-xs"
                  />

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendNote}
                    disabled={!coachNoteInput.trim()}
                    className="w-full font-semibold"
                  >
                    Kirim Catatan Pendampingan
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bg-white border-warm-border p-8 text-center text-xs text-gray-400 italic">
                Pilih peserta dari daftar di sebelah kiri untuk melihat detail dan memberikan masukan coach.
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
