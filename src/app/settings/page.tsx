"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Bell, Lock, Check, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

export default function SettingsPage() {
  const supabase = createClient();
  const [city, setCity] = useState("Jakarta");
  const [timezone, setTimezone] = useState("Auto");
  const [timeFormat, setTimeFormat] = useState<"24" | "12">("24");
  const [dateFormat, setDateFormat] = useState<"full" | "short">("full");
  const [prayerNotif, setPrayerNotif] = useState(true);
  const [habitNotif, setHabitNotif] = useState(true);
  const [journalPrivacy, setJournalPrivacy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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

        const { data: profile } = await supabase
          .from("profiles")
          .select("location")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.location) {
          setCity(profile.location);
        }

        // Load local preferences if available
        const savedTz = localStorage.getItem("slj_timezone");
        if (savedTz) setTimezone(savedTz);
        const savedTf = localStorage.getItem("slj_time_format") as "24" | "12";
        if (savedTf) setTimeFormat(savedTf);
      } catch (err) {
        console.error("Gagal memuat pengaturan:", err);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            location: city,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }

      localStorage.setItem("slj_timezone", timezone);
      localStorage.setItem("slj_time_format", timeFormat);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Gagal menyimpan pengaturan:", err);
    } finally {
      setSaving(false);
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

      <main className="max-w-wizard mx-auto px-4 md:px-6 pt-6 space-y-6">
        <Card className="bg-white border-warm-border p-6 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Tabs defaultValue="notifikasi">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="notifikasi" className="gap-1.5 text-xs">
                  <Bell className="h-3.5 w-3.5" /> Notifikasi & Lokasi
                </TabsTrigger>
                <TabsTrigger value="privasi" className="gap-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5" /> Privasi & Data
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Notifikasi & Lokasi */}
              <TabsContent value="notifikasi" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="Auto">Auto Detect (Otomatis)</option>
                      <option value="WIB">WIB (Asia/Jakarta - UTC+7)</option>
                      <option value="WITA">WITA (Asia/Makassar - UTC+8)</option>
                      <option value="WIT">WIT (Asia/Jayapura - UTC+9)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      Penentuan tampilan nama zona waktu pada Live Clock.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-warm-border">
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
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
                    <Bell className="h-4 w-4 text-accent" /> Preferensi Notifikasi In-App & Email
                  </label>

                  <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-warm-bg/30">
                    <div>
                      <span className="text-xs font-semibold text-navy-900 block">Pengingat Waktu Sholat</span>
                      <span className="text-[11px] text-gray-500">Notifikasi sebelum masuk waktu sholat 5 waktu.</span>
                    </div>
                    <Switch checked={prayerNotif} onCheckedChange={setPrayerNotif} />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-md border border-warm-border bg-warm-bg/30">
                    <div>
                      <span className="text-xs font-semibold text-navy-900 block">Pengingat Habit & Jurnal Harian</span>
                      <span className="text-[11px] text-gray-500">Pengingat sesuai jam yang Anda tetapkan di Action Plan.</span>
                    </div>
                    <Switch checked={habitNotif} onCheckedChange={setHabitNotif} />
                  </div>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-navy-900 block">Metode Login: Google OAuth</span>
                          <span className="text-[11px] text-slate-600">
                            {hasPassword ? "Fitur password aktif (Anda dapat merubah password akun Anda)" : "Anda terdaftar dengan Google. Set password di bawah untuk mengaktifkan fitur ganti password."}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                          Google Login
                        </span>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={hasPassword ? "Masukkan password baru (min. 6 karakter)" : "Set password baru (min. 6 karakter)"}
                          className="text-xs max-w-sm bg-white"
                        />
                        <Button
                          type="button"
                          onClick={handleUpdatePassword}
                          disabled={updatingSecurity || !newPassword}
                          className="text-xs bg-navy-900 text-white font-bold"
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
                        <div className="flex items-center gap-2">
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Email baru..."
                            className="text-xs max-w-sm bg-white"
                          />
                          <Button
                            type="button"
                            onClick={handleUpdateEmail}
                            disabled={updatingSecurity || !newEmail}
                            className="text-xs bg-navy-900 text-white font-bold"
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
                        <div className="flex items-center gap-2">
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Password baru (min 6 karakter)..."
                            className="text-xs max-w-sm bg-white"
                          />
                          <Button
                            type="button"
                            onClick={handleUpdatePassword}
                            disabled={updatingSecurity || !newPassword}
                            className="text-xs bg-navy-900 text-white font-bold"
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

            <CardFooter className="p-0 border-t border-warm-border pt-4 flex justify-end">
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
            </CardFooter>
          </form>
        </Card>
      </main>
    </ParticipantLayout>
  );
}
