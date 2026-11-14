"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSljAccess } from "@/lib/program-access";
import { getDeviceTimeZone } from "@/lib/local-date";
import { formatSupabaseError } from "@/lib/company-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPrayerLocation } from "@/lib/prayer-times";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"trial" | "program">("trial");
  const [trialOpen, setTrialOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        const programMode =
          new URLSearchParams(window.location.search).get("mode") === "program";
        const access = await getSljAccess(supabase);
        if (access?.kind === "staff") {
          router.replace("/login");
          return;
        }
        if (access?.kind === "trial" && !programMode) {
          router.replace("/trial");
          return;
        }
        const { data: offer, error: offerError } =
          await supabase.rpc("slj_trial_offer");
        if (cancelled) return;
        setEmail(user.email || "");
        setName(access?.full_name || user.user_metadata?.full_name || "");
        setTrialOpen(!offerError && offer?.enabled === true);
        setMode(
          programMode || offerError || !offer?.enabled ? "program" : "trial",
        );
        if (getDeviceTimeZone() === "Asia/Riyadh") setCity("Makkah");
        setReady(true);
      } catch (cause) {
        if (!cancelled) {
          setError(
            formatSupabaseError(
              cause,
              "Halaman belum dapat dimuat. Silakan coba lagi.",
            ),
          );
          setReady(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "trial") {
        const location = getPrayerLocation(city);
        const { error: failure } = await supabase.rpc(
          "start_slj_spiritual_trial",
          {
            p_full_name: name.trim(),
            p_city: city.trim(),
            p_timezone: location.timeZone || getDeviceTimeZone(),
          },
        );
        if (failure) throw failure;
        router.replace("/trial");
      } else {
        const { error: failure } = await supabase.rpc(
          "enroll_participant_by_access_code",
          {
            p_full_name: name.trim(),
            p_program_code: code.trim().toUpperCase(),
          },
        );
        if (failure) throw failure;
        router.replace("/dashboard");
      }
      router.refresh();
    } catch (cause) {
      setError(
        formatSupabaseError(
          cause,
          "Belum berhasil melanjutkan. Periksa isian Anda dan coba lagi.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#F5F7FB] px-5 py-7 text-navy-900 sm:py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-9 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Kembali ke beranda">
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney"
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/panduan"
            className="inline-flex min-h-11 items-center text-sm text-slate-600 underline underline-offset-4"
          >
            Panduan mulai
          </Link>
        </div>
        <Link
          href="/"
          className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> Beranda
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mulai perjalanan Anda.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Bangun kebiasaan yang lebih bermakna, satu hari pada satu waktu.
        </p>
        {!ready ? (
          <p role="status" className="py-10 text-sm text-slate-600">
            Memeriksa akses Anda…
          </p>
        ) : (
          <>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              {trialOpen && (
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  {(
                    [
                      ["trial", "Uji coba gratis"],
                      ["program", "Kode program"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mode === value}
                      disabled={busy}
                      onClick={() => {
                        setMode(value);
                        setError("");
                      }}
                      className={`min-h-11 rounded-lg px-2 text-sm font-medium ${mode === value ? "bg-white text-navy-900 shadow-sm" : "text-slate-600"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <h2 className="text-xl font-semibold">
                {mode === "trial"
                  ? "14 hari untuk merawat kebiasaan baik"
                  : "Bergabung dengan program"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "trial"
                  ? "Gratis, tanpa kartu pembayaran. Masa uji coba dimulai setelah Anda menekan tombol mulai."
                  : "Masukkan kode yang Anda terima dari penyelenggara. Organisasi dan program akan terisi sesuai kode tersebut."}
              </p>
              {mode === "trial" && (
                <ul className="my-5 space-y-2 text-sm text-slate-700">
                  {[
                    "Catatan salat dan bacaan Al-Qur’an",
                    "Hadits harian dan jurnal refleksi",
                    "Pratinjau area pengembangan lainnya",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={submit} className="mt-5 space-y-5">
                <Input
                  label="Nama lengkap"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={busy}
                />
                {mode === "trial" ? (
                  <>
                    <Input
                      label="Kota untuk jadwal salat"
                      list="prayer-cities"
                      autoComplete="address-level2"
                      required
                      minLength={2}
                      maxLength={120}
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      disabled={busy}
                    />
                    <datalist id="prayer-cities">
                      {[
                        "Jakarta",
                        "Bandung",
                        "Surabaya",
                        "Makassar",
                        "Makkah",
                        "Madinah",
                        "Jeddah",
                      ].map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                    <p className="text-xs leading-5 text-slate-500">
                      Kota dan zona waktu dapat diubah melalui Pengaturan,
                      termasuk saat Anda bepergian.
                    </p>
                  </>
                ) : (
                  <Input
                    label="Kode program"
                    autoComplete="off"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder="Kode dari penyelenggara"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    disabled={busy}
                  />
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full gap-2 rounded-xl"
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy
                    ? "Menyiapkan perjalanan…"
                    : mode === "trial"
                      ? "Mulai 14 hari gratis"
                      : "Bergabung dengan program"}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="min-w-0 break-all">Masuk sebagai {email}</span>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.replace("/login");
                  router.refresh();
                }}
                className="inline-flex min-h-11 items-center gap-2 font-medium text-slate-600"
              >
                <LogOut aria-hidden className="h-4 w-4" /> Ganti akun
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
