"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, CheckCircle2 } from "lucide-react";

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
}

export function QuranTracker({ userId, onQuranLogged }: QuranTrackerProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<QuranLogEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [surahName, setSurahName] = useState("");
  const [fromAyat, setFromAyat] = useState<number | "">("");
  const [toAyat, setToAyat] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadQuranLogs() {
      if (!userId) return;
      try {
        const { data } = await supabase
          .from("quran_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) {
          setLogs(data);
        }
      } catch (err) {
        console.error("Gagal memuat log Al-Qur'an:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuranLogs();
  }, [userId]);

  const hasReadToday = logs.some((l) => l.date === todayStr);

  const syncHabitLog = async (habitTitle: string, completed: boolean) => {
    try {
      const { data: habit } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", userId)
        .ilike("title", habitTitle)
        .eq("is_archived", false)
        .maybeSingle();

      if (!habit) return;

      if (completed) {
        await supabase.from("habit_logs").upsert(
          { habit_id: habit.id, user_id: userId, date: todayStr, completed: true },
          { onConflict: "habit_id,date" }
        );
      } else {
        await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habit.id)
          .eq("user_id", userId)
          .eq("date", todayStr);
      }
    } catch (err) {
      console.error("syncHabitLog (QuranTracker):", err);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surahName.trim() || !fromAyat || !toAyat) return;

    const fromNum = Number(fromAyat);
    const toNum = Number(toAyat);
    const totalAyat = Math.max(1, toNum - fromNum + 1);

    setSaving(true);
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

      if (data && !error) {
        setLogs([data, ...logs]);
        setSurahName("");
        setFromAyat("");
        setToAyat("");
        setShowModal(false);

        // Sync habit: "Tilawah Al-Qur'an" and "Khatam 1 Juz Al-Qur'an"
        await syncHabitLog("Tilawah Al-Qur'an", true);
        await syncHabitLog("Khatam 1 Juz Al-Qur'an", true);

        if (onQuranLogged) {
          onQuranLogged();
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan tilawah Qur'an:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-border/60 pb-3">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            📖
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
            onClick={() => setShowModal(true)}
            className="text-xs h-8.5 gap-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl px-3.5 shadow-2xs"
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
            onClick={() => setShowModal(true)}
            className="text-xs font-bold bg-navy-900 text-white rounded-lg px-4"
          >
            + Tambah Catatan Tilawah Pertama
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left font-bold">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Nama Surat</th>
                <th className="py-2 px-3 text-center">Jumlah Ayat</th>
                <th className="py-2 px-3 text-right">Rentang Ayat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-navy-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Surat {item.surah_name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold">
                      {item.total_ayat} Ayat
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    Ayat {item.from_ayat} - {item.to_ayat}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Nama Surat:</label>
              <Input
                value={surahName}
                onChange={(e) => setSurahName(e.target.value)}
                placeholder="Contoh: Al-Baqarah, Yasin, Al-Mulk..."
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Dari Ayat:</label>
                <Input
                  type="number"
                  value={fromAyat}
                  onChange={(e) => setFromAyat(e.target.value ? Number(e.target.value) : "")}
                  placeholder="1"
                  min={1}
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Sampai Ayat:</label>
                <Input
                  type="number"
                  value={toAyat}
                  onChange={(e) => setToAyat(e.target.value ? Number(e.target.value) : "")}
                  placeholder="20"
                  min={1}
                  className="text-xs rounded-xl"
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
