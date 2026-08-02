"use client";

import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [requireAccessCode, setRequireAccessCode] = useState(true);
  const [autoAssignCoach, setAutoAssignCoach] = useState(true);
  const [journalPrivacy, setJournalPrivacy] = useState(true);
  const [inactivityDays, setInactivityDays] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("system_settings")
        .select("require_access_code_on_signup, auto_assign_coach_on_signup, enforce_absolute_journal_privacy, monitoring_inactivity_days")
        .eq("id", 1)
        .single();
      if (error) setErrorMsg("Pengaturan sistem belum dapat dimuat.");
      if (data) {
        setRequireAccessCode(data.require_access_code_on_signup);
        setAutoAssignCoach(data.auto_assign_coach_on_signup);
        setJournalPrivacy(data.enforce_absolute_journal_privacy);
        setInactivityDays(data.monitoring_inactivity_days);
      }
      setLoading(false);
    }
    loadSettings();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrorMsg(null);
    const { error } = await supabase.rpc("update_system_settings", {
      p_require_access_code_on_signup: requireAccessCode,
      p_auto_assign_coach_on_signup: autoAssignCoach,
      p_enforce_absolute_journal_privacy: journalPrivacy,
      p_monitoring_inactivity_days: inactivityDays,
    });
    if (error) setErrorMsg(error.message || "Pengaturan belum tersimpan.");
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b border-[#EAE5D9] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-[#C79A3C]" /> System & Security Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Pengaturan global yang dipakai workflow enrollment dan monitoring SLJ.</p>
      </div>

      {saved && <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">Pengaturan berhasil disimpan ke database.</div>}
      {errorMsg && <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{errorMsg}</div>}

      {loading ? (
        <div className="rounded-2xl border border-[#EAE5D9] bg-white p-8 text-xs text-slate-500">Memuat pengaturan sistem...</div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-6 shadow-2xs">
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-[#071A33] border-b border-[#EAE5D9] pb-3">Keamanan Access Code & Sign Up</h2>
            <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
              <span><strong className="block text-xs text-[#071A33]">Wajibkan Access Code saat Registrasi Peserta</strong><span className="text-xs text-slate-500">Enrollment hanya dapat aktif melalui kode batch resmi.</span></span>
              <input type="checkbox" checked={requireAccessCode} onChange={(e) => setRequireAccessCode(e.target.checked)} className="h-4 w-4 rounded accent-[#0B2C6B]" />
            </label>
            <label className="flex items-start justify-between gap-4 py-2 border-t border-[#EAE5D9] cursor-pointer">
              <span><strong className="block text-xs text-[#071A33]">Otomatiskan Penugasan Coach via Access Code</strong><span className="text-xs text-slate-500">Coach dari batch dipakai sebagai assignment canonical peserta.</span></span>
              <input type="checkbox" checked={autoAssignCoach} onChange={(e) => setAutoAssignCoach(e.target.checked)} className="h-4 w-4 rounded accent-[#0B2C6B]" />
            </label>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#EAE5D9]">
            <h2 className="text-base font-extrabold text-[#071A33] border-b border-[#EAE5D9] pb-3">Monitoring & Privacy</h2>
            <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
              <span><strong className="block text-xs text-[#071A33]">Enforce Absolute Journal Privacy</strong><span className="text-xs text-slate-500">Jurnal privat tidak dibuka ke dashboard HR.</span></span>
              <input type="checkbox" checked={journalPrivacy} onChange={(e) => setJournalPrivacy(e.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
            </label>
            <label className="block space-y-2 border-t border-[#EAE5D9] pt-4">
              <span className="block text-xs font-bold text-[#071A33]">Batas Inaktivitas (hari)</span>
              <input type="number" min={1} max={30} value={inactivityDays} onChange={(e) => setInactivityDays(Number(e.target.value))} className="w-28 rounded-lg border border-[#EAE5D9] px-3 py-2 text-xs" />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-60">
              <Save className="h-4 w-4 text-[#C79A3C]" /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
