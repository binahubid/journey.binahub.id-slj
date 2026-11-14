"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, CheckCircle2 } from "lucide-react";
import { DEFAULT_TIME_ZONE, getHabitOccurrenceKey, getLocalDateString, normalizeHabitFrequency } from "@/lib/local-date";

interface QuranLogEntry {
  id: string;
  date: string;
  surah_name: string;
  total_ayat: number;
  from_ayat: number;
  to_ayat: number;
}

interface QuranTrackerProps {
  userId: string;
  onQuranLogged?: () => void;
  timeZone?: string;
}

export function QuranTracker({ userId, onQuranLogged, timeZone = DEFAULT_TIME_ZONE }: QuranTrackerProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<QuranLogEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [surahName, setSurahName] = useState("");
  const [fromAyat, setFromAyat] = useState<number | "">("");
  const [toAyat, setToAyat] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = getLocalDateString(new Date(), timeZone);

  useEffect(() => {
    async function loadQuranLogs() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("quran_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;

        if (data) {
          setLogs(data);
        }
      } catch (err) {
        console.error("Gagal memuat log Al-Qur'an:", err);
        setErrorMsg("Riwayat tilawah belum dapat dimuat.");
      } finally {
        setLoading(false);
      }
    }
    loadQuranLogs();
  }, [userId, supabase]);

  const hasReadToday = logs.some((l) => l.date === todayStr);

  const syncHabitLog = async (habitTitle: string, completed: boolean) => {
    try {
      const { data: habits, error: habitError } = await supabase
        .from("habits")
        .select("id,frequency")
        .eq("user_id", userId)
        .ilike("title", habitTitle);
      if (habitError) throw habitError;

      if (!habits?.length) return;

      for (const habit of habits) {
        const occurrenceKey = getHabitOccurrenceKey(normalizeHabitFrequency(habit.frequency), new Date(), timeZone);
        if (completed) {
          const { error } = await supabase.from("habit_logs").upsert(
            { habit_id: habit.id, user_id: userId, date: occurrenceKey, activity_date: todayStr, completed: true, completed_count: 1 },
            { onConflict: "habit_id,date" }
          );
          if (error) throw error;
        } else {
          const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("user_id", userId).eq("date", occurrenceKey);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error("syncHabitLog (QuranTracker):", err);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!surahName.trim() || !fromAyat || !toAyat) return;

    const fromNum = Number(fromAyat);
    const toNum = Number(toAyat);
    if (toNum < fromNum) {
      setErrorMsg("Ayat akhir tidak boleh lebih kecil dari ayat awal.");
      return;
    }
    const totalAyat = Math.max(1, toNum - fromNum + 1);

    setSaving(true);
    setErrorMsg(null);
    try {
      const newEntry = {
        user_id: userId,
        date: todayStr,
        surah_name: surahName.trim(),
        total_ayat: totalAyat,
        from_ayat: fromNum,
        to_ayat: toNum,
      };

      const { data, error } = await supabase
        .from("quran_logs")
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLogs([data, ...logs]);
        setSurahName("");
        setFromAyat("");
        setToAyat("");
        setShowModal(false);

        // Satu catatan tilawah tidak otomatis berarti khatam satu juz.
        await syncHabitLog("Tilawah Al-Qur'an", true);

        if (onQuranLogged) {
          onQuranLogged();
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan tilawah Qur'an:", err);
      setErrorMsg("Catatan tilawah belum tersimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-border/60 pb-3">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-navy-900">Tilawah & Baca Al-Qur&apos;an</h3>
            <p className="text-[11px] text-gray-500">Tracking bacaan harian terukur</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasReadToday && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Telah Membaca Hari Ini
            </span>
          )}

          <Button
            disabled={saving}
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="min-h-11 gap-1.5 rounded-xl px-3.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Bacaan</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Memuat riwayat tilawah...</div>
      ) : logs.length === 0 ? (
        <div className="p-5 text-center bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
          <p className="text-xs text-slate-500 font-medium">Belum ada catatan bacaan Al-Qur&apos;an hari ini.</p>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="text-xs font-bold bg-navy-900 text-white rounded-lg px-4"
          >
            + Tambah Catatan Tilawah Pertama
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100" aria-label="Riwayat bacaan Al-Qur’an">
          {logs.map(item => <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0"><p className="break-words text-sm font-medium text-navy-900">{item.surah_name}</p><p className="mt-1 text-xs leading-5 text-slate-500">Ayat {item.from_ayat}–{item.to_ayat} · {new Date(item.date + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p></div>
            <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium tabular-nums text-navy-900">{item.total_ayat} ayat</span>
          </li>)}
        </ul>
      )}
      {errorMsg && !showModal && <p role="alert" className="text-xs font-semibold text-rose-700">{errorMsg}</p>}

      {/* Modal Input Bacaan Al-Qur'an */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Catat Bacaan Al-Qur&apos;an</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEntry} className="space-y-3.5 py-2">
            {errorMsg && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">{errorMsg}</p>}
            <div className="space-y-1">
              <label htmlFor="quran-surah" className="text-sm font-medium text-slate-700 block">Nama surah</label>
              <Input
                id="quran-surah"
                disabled={saving}
                value={surahName}
                onChange={(e) => setSurahName(e.target.value)}
                placeholder="Contoh: Al-Baqarah, Yasin, Al-Mulk..."
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="quran-from" className="text-sm font-medium text-slate-700 block">Dari ayat</label>
                <Input
                  type="number"
                  id="quran-from"
                  disabled={saving}
                  value={fromAyat}
                  onChange={(e) => setFromAyat(e.target.value ? Number(e.target.value) : "")}
                  placeholder="1"
                  min={1}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="quran-to" className="text-sm font-medium text-slate-700 block">Sampai ayat</label>
                <Input
                  type="number"
                  id="quran-to"
                  disabled={saving}
                  value={toAyat}
                  onChange={(e) => setToAyat(e.target.value ? Number(e.target.value) : "")}
                  placeholder="20"
                  min={1}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            {fromAyat && toAyat && Number(toAyat) >= Number(fromAyat) && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center justify-between">
                <span>Total ayat dibaca:</span>
                <span className="font-bold text-sm text-emerald-700">{Number(toAyat) - Number(fromAyat) + 1} Ayat</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowModal(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-5">
                {saving ? "Memproses..." : "Simpan Bacaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
