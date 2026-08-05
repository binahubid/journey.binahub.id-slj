"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BookMarked, Quote, CheckCircle2 } from "lucide-react";
import { DEFAULT_TIME_ZONE, getHabitOccurrenceKey, getLocalDateString, normalizeHabitFrequency } from "@/lib/local-date";

interface DailyHadithWidgetProps {
  userId: string;
  timeZone?: string;
}

const HADITHS = [
  {
    matn: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    translation: "Sesungguhnya setiap amalan tergantung pada niatnya, dan sesungguhnya setiap orang akan mendapatkan sesuai dengan apa yang ia niatkan.",
    narrator: "HR. Bukhari no. 1 & Muslim no. 1907 (dari Umar bin Khattab RA)",
  },
  {
    matn: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    translation: "Sebaik-baik kalian adalah orang yang mempelajari Al-Qur'an dan mengajarkannya.",
    narrator: "HR. Bukhari no. 5027 (dari Utsman bin Affan RA)",
  },
  {
    matn: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    translation: "Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah akan mempermudah baginya jalan menuju surga.",
    narrator: "HR. Muslim no. 2699 (dari Abu Hurairah RA)",
  },
  {
    matn: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    translation: "Amalan yang paling dicintai Allah adalah amalan yang kontinyu (istiqamah) meskipun sedikit.",
    narrator: "HR. Bukhari no. 6464 & Muslim no. 783 (dari Aisyah RA)",
  },
  {
    matn: "الطَّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ",
    translation: "Bersuci adalah setengah dari iman, dan ucapan 'Alhamdulillah' memenuhi timbangan pahala.",
    narrator: "HR. Muslim no. 223 (dari Abu Malik Al-Asy'ari RA)",
  },
  {
    matn: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation: "Tidak beriman salah seorang di antara kalian sampai ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.",
    narrator: "HR. Bukhari no. 13 & Muslim no. 45 (dari Anas bin Malik RA)",
  },
];

export function DailyHadithWidget({ userId, timeZone = DEFAULT_TIME_ZONE }: DailyHadithWidgetProps) {
  const supabase = createClient();
  const todayStr = getLocalDateString(new Date(), timeZone);

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hadith = HADITHS[dayOfYear % HADITHS.length];

  const [isRead, setIsRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadHadithLog() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("hadith_logs")
          .select("is_read")
          .eq("user_id", userId)
          .eq("date", todayStr)
          .maybeSingle();
        if (error) throw error;

        if (data) {
          setIsRead(data.is_read || false);
        }
      } catch (err) {
        console.error("Gagal memuat log hadits:", err);
        setErrorMsg("Status baca hadits belum dapat dimuat.");
      } finally {
        setLoading(false);
      }
    }
    loadHadithLog();
  }, [userId, todayStr]);

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
      console.error("syncHabitLog (DailyHadithWidget):", err);
    }
  };

  const toggleHadithRead = async (checked: boolean) => {
    if (saving || loading) return;
    setSaving(true);
    setErrorMsg(null);
    setIsRead(checked);
    try {
      if (checked) {
        const { error } = await supabase.from("hadith_logs").upsert(
          {
            user_id: userId,
            date: todayStr,
            is_read: true,
          },
          { onConflict: "user_id,date" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hadith_logs")
          .delete()
          .eq("user_id", userId)
          .eq("date", todayStr);
        if (error) throw error;
      }

      // Sync matching PTP habits
      await syncHabitLog("Membaca Hadits Harian", checked);
    } catch (err) {
      console.error("Gagal update status baca hadits:", err);
      setIsRead(!checked);
      setErrorMsg("Status baca belum tersimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border-warm-border p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between relative overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-warm-border/60 pb-3 z-10 relative">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            <BookMarked className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-navy-900">Hadits Hari Ini</h3>
            <p className="text-[11px] text-gray-500">Refleksi Hadits Shahih Pilihan</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50/70 px-3 py-1.5 rounded-full border border-amber-200">
          <Checkbox
            checked={isRead}
            disabled={loading || saving}
            onCheckedChange={(c) => toggleHadithRead(!!c)}
            className="h-4 w-4 rounded-md border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-white"
          />
          <span className="text-xs font-bold text-amber-900">
            {isRead ? "Sudah Dibaca ✓" : "Tandai Dibaca"}
          </span>
        </div>
      </div>
      {errorMsg && <p role="alert" className="text-xs font-semibold text-rose-700">{errorMsg}</p>}

      <div className="space-y-3 z-10 relative flex-1 flex flex-col justify-between">
        <p className="text-right font-serif text-lg text-navy-900 leading-loose tracking-wide dir-rtl font-bold bg-amber-50/30 p-3 rounded-xl border border-amber-100/50">
          {hadith.matn}
        </p>

        <p className="text-xs text-slate-700 italic font-serif leading-relaxed">
          &ldquo;{hadith.translation}&rdquo;
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
          <span className="text-amber-800 font-bold">{hadith.narrator}</span>
          {isRead && (
            <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Dibaca & Direfleksikan
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
