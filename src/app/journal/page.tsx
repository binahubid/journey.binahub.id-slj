"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Search,
  Calendar,
  Edit3,
  Check,
  Lock,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  isPrivate: boolean;
}

export default function JournalPage() {
  const supabase = createClient();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newContent, setNewContent] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJournals() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("journals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setJournals(
            data.map((j) => ({
              id: j.id,
              date: new Date(j.created_at || j.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              content: j.content,
              isPrivate: j.is_private ?? true,
            }))
          );
        } else {
          setJournals([]);
        }
      } catch (err) {
        console.error("Gagal memuat journal:", err);
      } finally {
        setLoading(false);
      }
    }

    loadJournals();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStr = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase.from("journals").insert({
        user_id: user.id,
        date: todayStr,
        content: newContent,
        is_private: true,
      }).select().single();

      if (!error && data) {
        const formattedEntry: JournalEntry = {
          id: data.id,
          date: `Hari Ini, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
          content: newContent,
          isPrivate: true,
        };

        setJournals([formattedEntry, ...journals]);
        setNewContent("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Gagal menyimpan journal:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredJournals = journals.filter((j) =>
    j.content.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/journal" pageTitle="Journal • Refleksi Harian">
      <main className="max-w-4xl mx-auto space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-warm-border shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-navy-900 leading-tight">
                Refleksi & Journal Harian
              </h1>
              <p className="text-xs text-gray-500">
                Catat muhasabah, hikmah, dan perasaan spiritual Anda sepanjang hari
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-semibold gap-1 self-start sm:self-auto border-warm-border text-navy-900 bg-warm-bg px-3 py-1">
            <Lock className="h-3 w-3 text-emerald-600" /> Privat & Terenkripsi
          </Badge>
        </div>

        {/* Write New Journal Box */}
        <Card className="bg-white border-warm-border p-4 sm:p-6 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-navy-900 flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-amber-600" /> Tulis Refleksi Journal Hari Ini
          </h2>

          <form onSubmit={handleSave} className="space-y-3">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Bagaimana perjalanan spiritualmu hari ini? Tuliskan refleksi, rasa syukur, atau hal yang ingin dipelajari..."
              className="text-xs min-h-[110px] bg-white border-warm-border"
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                🔒 Jurnal ini privat dan hanya bisa diakses oleh Anda.
              </span>
              <Button
                type="submit"
                disabled={saving || !newContent.trim()}
                className="bg-navy-900 hover:bg-black text-amber-300 font-bold text-xs gap-1.5 px-5 h-9 rounded-xl w-full sm:w-auto"
              >
                {saving ? (
                  "Menyimpan..."
                ) : saved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Tersimpan
                  </>
                ) : (
                  "Simpan Journal"
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Previous Journal History */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-navy-900 text-xs tracking-wider uppercase">
              RIWAYAT JOURNAL SAYA ({filteredJournals.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari refleksi journal..."
                className="text-xs pl-8 h-8 bg-white border-warm-border"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredJournals.length === 0 ? (
              <Card className="bg-white border-warm-border p-6 text-center text-xs text-gray-400 italic rounded-2xl">
                Belum ada catatan refleksi journal. Mulailah menulis entri pertama Anda di atas.
              </Card>
            ) : (
              filteredJournals.map((j) => (
                <Card key={j.id} className="bg-white border-warm-border p-4 sm:p-5 rounded-2xl shadow-2xs space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" /> {j.date}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-warm-border text-gray-500 gap-1">
                      <Lock className="h-2.5 w-2.5" /> Privat
                    </Badge>
                  </div>
                  <p className="text-xs text-navy-900 font-serif leading-relaxed italic bg-warm-bg/40 p-3.5 rounded-xl border border-warm-border/60">
                    &ldquo;{j.content}&rdquo;
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </ParticipantLayout>
  );
}
