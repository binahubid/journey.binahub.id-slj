"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Bell, Lock, Check, Clock, Download, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { usePwaInstall } from "@/components/pwa/PwaProvider";
import { getDeviceTimeZone, normalizeTimeZone } from "@/lib/local-date";
import { disableWebPush, enableWebPush, getPushPermission, isPushSupported } from "@/lib/web-push";

export default function SettingsPage() {
  const supabase = createClient();
  const { canInstall, isInstalled, isIos, install } = usePwaInstall();
  const [city, setCity] = useState("Jakarta");
  const [timezone, setTimezone] = useState("Auto");
  const [detectedTimeZone, setDetectedTimeZone] = useState("Asia/Jakarta");
  const [timeFormat, setTimeFormat] = useState<"24" | "12">("24");
  const [dateFormat, setDateFormat] = useState<"full" | "short">("full");
  const [prayerNotif, setPrayerNotif] = useState(false);
  const [habitNotif, setHabitNotif] = useState(true);
  const [journalNotif, setJournalNotif] = useState(true);
  const [quranNotif, setQuranNotif] = useState(false);
  const [hadithNotif, setHadithNotif] = useState(false);
  const [checkpointNotif, setCheckpointNotif] = useState(true);
  const [socialNotif, setSocialNotif] = useState(true);
  const [inactivityNotif, setInactivityNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [updatingPush, setUpdatingPush] = useState(false);
  const [journalPrivacy, setJournalPrivacy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [installMsg, setInstallMsg] = useState<string | null>(null);

  // Auth provider & Security States
  const [userEmail, setUserEmail] = useState("");
  const [authProvider, setAuthProvider] = useState<"google" | "email">("email");
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [securityErr, setSecurityErr] = useState("");
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserEmail(user.email || "");

        // Detect provider
        const provider = user.app_metadata?.provider || user.identities?.[0]?.provider || "email";
        if (provider === "google") {
          setAuthProvider("google");
        } else {
          setAuthProvider("email");
        }

        // Check if user has encrypted password / password set indicator in localStorage or metadata
        const passwordSetLocal = localStorage.getItem(`slj_pass_set_${user.id}`);
        if (passwordSetLocal === "true" || provider === "email") {
          setHasPassword(true);
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("location, timezone, timezone_mode")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        if (profile?.location) {
          setCity(profile.location);
        }
        setDetectedTimeZone(getDeviceTimeZone());
        if (profile?.timezone_mode === "AUTO") {
          setTimezone("Auto");
        } else if (profile?.timezone) {
          const zoneLabel = profile.timezone === "Asia/Jakarta"
            ? "WIB"
            : profile.timezone === "Asia/Makassar"
              ? "WITA"
              : profile.timezone === "Asia/Jayapura"
                ? "WIT"
                : profile.timezone;
          setTimezone(zoneLabel);
        }

        const { data: settings, error: settingsError } = await supabase
          .from("settings")
          .select("prayer_notifications_enabled, habit_notifications_enabled, journal_notifications_enabled, quran_notifications_enabled, hadith_notifications_enabled, checkpoint_notifications_enabled, social_notifications_enabled, inactivity_notifications_enabled, push_notifications_enabled, journal_privacy_default")
          .eq("user_id", user.id)
          .maybeSingle();
        if (settingsError) throw settingsError;
        if (settings) {
          setPrayerNotif(settings.prayer_notifications_enabled ?? false);
          setHabitNotif(settings.habit_notifications_enabled ?? true);
          setJournalNotif(settings.journal_notifications_enabled ?? true);
          setQuranNotif(settings.quran_notifications_enabled ?? false);
          setHadithNotif(settings.hadith_notifications_enabled ?? false);
          setCheckpointNotif(settings.checkpoint_notifications_enabled ?? true);
          setSocialNotif(settings.social_notifications_enabled ?? true);
          setInactivityNotif(settings.inactivity_notifications_enabled ?? true);
          setPushNotif(settings.push_notifications_enabled ?? false);
          setJournalPrivacy(settings.journal_privacy_default ?? true);
        }

        setPushPermission(await getPushPermission());

        // Load local preferences if available
        const savedTz = localStorage.getItem("slj_timezone");
        if (savedTz) setTimezone(savedTz);
        const savedTf = localStorage.getItem("slj_time_format") as "24" | "12";
        if (savedTf) setTimeFormat(savedTf);
      } catch (err) {
        console.error("Gagal memuat pengaturan:", err);
        setErrorMsg("Pengaturan belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setSecurityErr("Password minimal 6 karakter");
      return;
    }
    setUpdatingSecurity(true);
    setSecurityErr("");
    setSecurityMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) localStorage.setItem(`slj_pass_set_${user.id}`, "true");

      setHasPassword(true);
      setNewPassword("");
      setSecurityMsg(authProvider === "google" && !hasPassword ? "Password berhasil diset untuk akun Google!" : "Password berhasil diperbarui!");
    } catch (err: any) {
      setSecurityErr(err.message || "Gagal memperbarui password");
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      setSecurityErr("Format email tidak valid");
      return;
    }
    setUpdatingSecurity(true);
    setSecurityErr("");
    setSecurityMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      setSecurityMsg(`Email verifikasi dikirimkan ke ${newEmail}. Silakan periksa inbox Anda.`);
      setNewEmail("");
    } catch (err: any) {
      setSecurityErr(err.message || "Gagal memperbarui email");
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
        if (user) {
         const { error } = await supabase
          .from("profiles")
          .update({
            location: city,
            timezone_mode: timezone === "Auto" ? "AUTO" : "MANUAL",
            timezone: timezone === "Auto" ? getDeviceTimeZone() : normalizeTimeZone(timezone),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        if (error) throw error;
        const { error: settingsError } = await supabase.from("settings").upsert({
          user_id: user.id,
           prayer_notifications_enabled: prayerNotif,
           habit_notifications_enabled: habitNotif,
           journal_notifications_enabled: journalNotif,
           quran_notifications_enabled: quranNotif,
           hadith_notifications_enabled: hadithNotif,
           checkpoint_notifications_enabled: checkpointNotif,
           social_notifications_enabled: socialNotif,
           inactivity_notifications_enabled: inactivityNotif,
           push_notifications_enabled: pushNotif,
           journal_privacy_default: journalPrivacy,
           preferred_prayer_city: city,
           updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (settingsError) throw settingsError;
      }

      localStorage.setItem("slj_timezone", timezone);
      localStorage.setItem("slj_time_format", timeFormat);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Gagal menyimpan pengaturan:", err);
      setErrorMsg("Pengaturan belum tersimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleInstall = async () => {
    setInstallMsg(null);
    const result = await install();
    if (result === "accepted") {
      setInstallMsg("SLJ berhasil ditambahkan ke Home Screen.");
    } else if (result === "dismissed") {
      setInstallMsg("Instalasi dibatalkan. Anda dapat mencobanya lagi kapan saja.");
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    setUpdatingPush(true);
    setErrorMsg(null);
    try {
      if (enabled) {
        await enableWebPush(supabase);
        setPushNotif(true);
      } else {
        await disableWebPush(supabase);
        setPushNotif(false);
      }
      setPushPermission(await getPushPermission());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Notifikasi HP belum dapat diperbarui.";
      setErrorMsg(message);
      setPushNotif(false);
    } finally {
      setUpdatingPush(false);
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
    <ParticipantLayout activePath="/settings" pageTitle="Pengaturan • Lokasi & Notifikasi">

      <main className="max-w-wizard mx-auto pt-6 pb-24 space-y-6">
        {errorMsg && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}
        <form onSubmit={handleSave} className="space-y-6">
          <Tabs defaultValue="notifikasi">
              <TabsList className="mb-4 w-full justify-start overflow-x-auto">
                <TabsTrigger value="notifikasi" className="gap-1.5 text-xs">
                  <Bell className="h-3.5 w-3.5" /> Notifikasi & Lokasi
                </TabsTrigger>
                <TabsTrigger value="privasi" className="gap-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5" /> Privasi & Data
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Notifikasi & Lokasi */}
              <TabsContent value="notifikasi" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-accent" /> Lokasi Kota (Waktu Sholat)
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Nama kota, misal: Jakarta, Surabaya, Bandung"
                      className="text-xs"
                    />
                    <p className="text-[11px] text-gray-500">
                      Dihitung otomatis via Aladhan API berdasarkan lokasi kota Anda.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-accent" /> Zona Waktu
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-navy-900 bg-white"
                    >
                       <option value="Auto">Otomatis mengikuti perangkat ({detectedTimeZone})</option>
                       <option value="WIB">WIB (Asia/Jakarta - UTC+7)</option>
                       <option value="WITA">WITA (Asia/Makassar - UTC+8)</option>
                       <option value="WIT">WIT (Asia/Jayapura - UTC+9)</option>
                       <option value="Asia/Riyadh">Makkah / Madinah (Asia/Riyadh - UTC+3)</option>
                       <option value="Australia/Perth">Australia Barat (Perth)</option>
                       <option value="Australia/Adelaide">Australia Tengah (Adelaide)</option>
                       <option value="Australia/Sydney">Australia Timur (Sydney)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      Penentuan tampilan nama zona waktu pada Live Clock.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-warm-border">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-navy-900">Format Jam</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeFormat("24")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          timeFormat === "24"
                            ? "bg-navy-900 text-white border-navy-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        24 Jam (18:45)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFormat("12")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          timeFormat === "12"
                            ? "bg-navy-900 text-white border-navy-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        12 Jam AM/PM
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-navy-900">Format Tanggal</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDateFormat("full")}
                        className={`py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold border transition-all text-center leading-tight ${
                          dateFormat === "full"
                            ? "bg-navy-900 text-white border-navy-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Lengkap (Hari, Tanggal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateFormat("short")}
                        className={`py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold border transition-all text-center leading-tight ${
                          dateFormat === "short"
                            ? "bg-navy-900 text-white border-navy-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Ringkas (DD/MM/YYYY)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-warm-border">
                  <label className="block text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-accent" /> Preferensi Pengingat
                  </label>

                  <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-warm-bg/30">
                    <div>
                      <span className="text-xs font-semibold text-navy-900 block">Pengingat Habit Harian</span>
                      <span className="text-[11px] text-gray-500">Pengingat utama pukul 20.00 jika habit hari ini belum selesai.</span>
                    </div>
                    <Switch checked={habitNotif} onCheckedChange={setHabitNotif} />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-warm-bg/30">
                    <div>
                      <span className="text-xs font-semibold text-navy-900 block">Pengingat Jurnal Harian</span>
                      <span className="text-[11px] text-gray-500">Pengingat utama pukul 21.00 jika jurnal hari ini belum ditulis.</span>
                    </div>
                    <Switch checked={journalNotif} onCheckedChange={setJournalNotif} />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Waktu Sholat</span><span className="text-[11px] text-gray-500">Opsional, pengingat waktu sholat.</span></div>
                      <Switch checked={prayerNotif} onCheckedChange={setPrayerNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Tilawah Al-Qur'an</span><span className="text-[11px] text-gray-500">Opsional, pukul 06.30 waktu lokal.</span></div>
                      <Switch checked={quranNotif} onCheckedChange={setQuranNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Hadits Hari Ini</span><span className="text-[11px] text-gray-500">Opsional, pukul 07.00 waktu lokal.</span></div>
                      <Switch checked={hadithNotif} onCheckedChange={setHadithNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Checkpoint Program</span><span className="text-[11px] text-gray-500">H-3, H-1, dan hari checkpoint.</span></div>
                      <Switch checked={checkpointNotif} onCheckedChange={setCheckpointNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Coach & Sahabat Safar</span><span className="text-[11px] text-gray-500">Respons coach dan pengingat pasangan.</span></div>
                      <Switch checked={socialNotif} onCheckedChange={setSocialNotif} />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-white">
                      <div><span className="text-xs font-semibold text-navy-900 block">Pengingat Tidak Aktif</span><span className="text-[11px] text-gray-500">Dikirim setelah 3 hari tanpa aktivitas.</span></div>
                      <Switch checked={inactivityNotif} onCheckedChange={setInactivityNotif} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-warm-border">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                    <Bell className="h-4 w-4 text-accent" /> Notifikasi HP
                  </label>
                  <div className="flex items-center justify-between gap-4 rounded-md border border-warm-border bg-warm-bg/30 p-4">
                    <div>
                      <span className="block text-xs font-semibold text-navy-900">Tampilkan pengingat di layar HP</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">
                        Pengingat tetap masuk ke akun. Opsi ini menambahkan Web Push ke notification tray perangkat.
                        {pushPermission === "denied" ? " Izin saat ini diblokir oleh browser." : ""}
                      </span>
                    </div>
                    <Switch
                      checked={pushNotif}
                      onCheckedChange={handlePushToggle}
                      disabled={updatingPush || !isPushSupported() || pushPermission === "denied"}
                    />
                  </div>
                  {pushPermission === "unsupported" && (
                    <p className="text-[11px] font-medium text-amber-800">Browser/perangkat ini belum mendukung Web Push. Notifikasi akun tetap tersedia.</p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-warm-border">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                    <Smartphone className="h-4 w-4 text-accent" /> Akses Cepat dari Home Screen
                  </label>

                  <div className="flex flex-col gap-3 rounded-md border border-warm-border bg-warm-bg/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-navy-900">
                        {isInstalled ? "SLJ sudah terpasang" : "Pasang SLJ di HP"}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">
                        Buka SLJ langsung dari ikon di Home Screen tanpa masuk ke browser terlebih dahulu.
                      </span>
                    </div>

                    {isInstalled ? (
                      <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-emerald-100 px-3 text-xs font-bold text-emerald-800">
                        <Check className="h-3.5 w-3.5" /> Terpasang
                      </span>
                    ) : canInstall ? (
                      <Button type="button" onClick={handleInstall} className="h-9 shrink-0 bg-navy-900 text-xs font-bold text-white">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Pasang di HP
                      </Button>
                    ) : isIos ? (
                      <p className="max-w-xs text-[11px] font-medium leading-relaxed text-slate-600">
                        Di iPhone/iPad: buka menu <strong>Bagikan</strong> di Safari, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
                      </p>
                    ) : (
                      <p className="max-w-xs text-[11px] font-medium leading-relaxed text-slate-600">
                        Buka menu browser, lalu pilih <strong>Install app</strong> atau <strong>Tambahkan ke layar utama</strong>.
                      </p>
                    )}
                  </div>

                  {installMsg && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
                      {installMsg}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 2: Privasi & Keamanan Account */}
              <TabsContent value="privasi" className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-accent" /> Default Privasi Jurnal
                  </label>

                  <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-warm-bg/30">
                    <div>
                      <span className="text-xs font-semibold text-navy-900 block">Jurnal Selalu Privat secara Default</span>
                      <span className="text-[11px] text-gray-500">Hanya dibagikan ke coach jika Anda mengaktifkan tombol berbagi secara manual per entri.</span>
                    </div>
                    <Switch checked={journalPrivacy} onCheckedChange={setJournalPrivacy} />
                  </div>
                </div>

                {/* Keamanan & Password Management */}
                <div className="space-y-4 pt-4 border-t border-warm-border">
                  <label className="block text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-accent" /> Pengaturan Keamanan Akun
                  </label>

                  {securityMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      {securityMsg}
                    </div>
                  )}
                  {securityErr && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {securityErr}
                    </div>
                  )}

                  {/* Google registered user: Set Password / Change Password */}
                  {authProvider === "google" && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-navy-900 block">Metode Login: Google OAuth</span>
                          <span className="text-[11px] text-slate-600 line-clamp-2">
                            {hasPassword ? "Fitur password aktif (Anda dapat merubah password akun Anda)" : "Anda terdaftar dengan Google. Set password di bawah untuk mengaktifkan fitur ganti password."}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase shrink-0">
                          Google Login
                        </span>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={hasPassword ? "Masukkan password baru (min. 6 karakter)" : "Set password baru (min. 6 karakter)"}
                          className="text-xs bg-white flex-1 min-w-0"
                        />
                        <Button
                          type="button"
                          onClick={handleUpdatePassword}
                          disabled={updatingSecurity || !newPassword}
                          className="text-xs bg-navy-900 text-white font-bold shrink-0"
                        >
                          {hasPassword ? "Ganti Password" : "Set Password"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Email registered user: Change Email & Change Password */}
                  {authProvider === "email" && (
                    <div className="space-y-4">
                      {/* Change Email */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-navy-900 block">Email Terdaftar</span>
                          <span className="text-[11px] text-slate-500">{userEmail}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Email baru..."
                            className="text-xs bg-white flex-1 min-w-0"
                          />
                          <Button
                            type="button"
                            onClick={handleUpdateEmail}
                            disabled={updatingSecurity || !newEmail}
                            className="text-xs bg-navy-900 text-white font-bold shrink-0"
                          >
                            Ganti Email
                          </Button>
                        </div>
                      </div>

                      {/* Change Password */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-navy-900 block">Password Akun</span>
                          <span className="text-[11px] text-slate-500">Ubah password akun email Anda.</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Password baru (min 6 karakter)..."
                            className="text-xs bg-white flex-1 min-w-0"
                          />
                          <Button
                            type="button"
                            onClick={handleUpdatePassword}
                            disabled={updatingSecurity || !newPassword}
                            className="text-xs bg-navy-900 text-white font-bold shrink-0"
                          >
                            Ganti Password
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="border-t border-slate-200/60 pt-4 flex justify-end">
              <Button type="submit" variant="primary" disabled={saving} className="font-semibold gap-1">
                {saving ? (
                  "Menyimpan..."
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" /> Tersimpan
                  </>
                ) : (
                  "Simpan Pengaturan"
                )}
              </Button>
            </div>
          </form>

          <div className="py-4">
            <div className="flex items-center gap-2 pb-3">
              <Lock className="h-3.5 w-3.5 text-accent" />
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Legal & Kebijakan
              </h3>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-[13px] font-semibold text-navy-900">Syarat &amp; Ketentuan</p>
                <p className="text-[11px] text-slate-500">Dokumen legal Platform BinaJourney — versi 1.1</p>
              </div>
              <Link
                href="/terms"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-navy-900 transition-colors"
              >
                Baca
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
      </main>
    </ParticipantLayout>
  );
}
