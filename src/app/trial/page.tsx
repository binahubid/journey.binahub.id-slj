"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  LockKeyhole,
  Moon,
  PenLine,
  Users,
  Compass,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getSljAccess,
  getTrialProgress,
  type SljAccess,
} from "@/lib/program-access";
import {
  getLocalDateString,
  normalizeTimeZone,
  resolveParticipantTimeZone,
} from "@/lib/local-date";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { PrayerTracker } from "@/components/domain/PrayerTracker";
import { QuranTracker } from "@/components/domain/QuranTracker";
import { DailyHadithWidget } from "@/components/domain/DailyHadithWidget";
import { PrayerTimesWidget } from "@/components/domain/PrayerTimesWidget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

const areas = [
  {
    name: "Pengembangan diri",
    icon: Heart,
    description:
      "Kenali pola diri, bangun kebiasaan, dan tentukan prioritas yang ingin Anda perbaiki.",
  },
  {
    name: "Kepemimpinan",
    icon: Compass,
    description:
      "Kembangkan cara memimpin yang bertanggung jawab dan selaras dengan nilai Anda.",
  },
  {
    name: "Relasi",
    icon: Users,
    description:
      "Latih komunikasi dan bangun hubungan yang lebih sehat di rumah maupun di tempat kerja.",
  },
  {
    name: "Kontribusi",
    icon: Briefcase,
    description:
      "Wujudkan perubahan yang bermanfaat bagi lingkungan dan komunitas Anda.",
  },
];
const activities = [
  { id: "prayer", label: "Salat", icon: Moon },
  { id: "quran", label: "Al-Qur’an", icon: BookOpen },
  { id: "hadith", label: "Hadits", icon: Heart },
  { id: "reflection", label: "Refleksi", icon: PenLine },
] as const;

export default function TrialPage() {
  const supabase = createClient();
  const router = useRouter();
  const [access, setAccess] = useState<SljAccess | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [activity, setActivity] =
    useState<(typeof activities)[number]["id"]>("prayer");
  const [preview, setPreview] = useState<(typeof areas)[number] | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load(markActive = false) {
      try {
        setError("");
        const data = await getSljAccess(supabase);
        if (cancelled) return;
        if (!data || data.kind === "none") {
          router.replace("/onboarding");
          return;
        }
        if (data.kind !== "trial") {
          router.replace(data.kind === "staff" ? "/login" : "/dashboard");
          return;
        }
        const timezone = resolveParticipantTimeZone(
          data.timezone,
          data.timezone_mode || "MANUAL",
        );
        if (data.timezone_mode === "AUTO" && timezone !== data.timezone) {
          const { error: timezoneError } = await supabase
            .from("profiles")
            .update({ timezone })
            .eq("user_id", data.user_id);
          if (timezoneError)
            throw new Error(
              "Zona waktu belum dapat diperbarui. Periksa koneksi atau atur zona waktu melalui Pengaturan.",
            );
        }
        if (cancelled) return;
        setAccess({ ...data, timezone });
        // Keep inactivity reminders aligned with real participant visits.
        if (markActive)
          await supabase
            .from("profiles")
            .update({ last_active_at: new Date().toISOString() })
            .eq("user_id", data.user_id);
      } catch (cause) {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Perjalanan belum dapat dimuat.",
          );
      }
    }
    void load(true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void load();
      }
    }, 60_000);
    const focus = () => {
      setNow(Date.now());
      void load(true);
    };
    window.addEventListener("focus", focus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [router, supabase, retry]);

  useEffect(() => {
    if (!access?.expires_at) return;
    const remaining = Date.parse(access.expires_at) - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(remaining + 20, 2_147_483_647),
    );
    return () => clearTimeout(timer);
  }, [access?.expires_at]);

  const progress = access ? getTrialProgress(access, now) : null;
  const zone = normalizeTimeZone(access?.timezone);
  const date = new Intl.DateTimeFormat("id-ID", {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <ParticipantLayout
      activePath="/trial"
      pageTitle="Perjalanan spiritual"
      hideBackToHome
      hideFooter
    >
      <div className="mx-auto max-w-5xl space-y-7 pb-3">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => setRetry((value) => value + 1)}
              className="ml-2 min-h-11 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}
        {!access || !progress ? (
          <p role="status" className="py-12 text-center text-sm text-slate-600">
            Menyiapkan perjalanan Anda…
          </p>
        ) : progress.expired ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:p-10">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-navy-900">
              <Check className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-500">
              Uji coba 14 hari telah berakhir
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Langkah kecil Anda berarti.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Terima kasih sudah memulai kebiasaan baik bersama BinaJourney.
              Lanjutkan perjalanan melalui program pendampingan yang sesuai
              dengan kebutuhan Anda.
            </p>
            <Link
              href="/#pricing"
              className={buttonVariants({
                className: "mt-7 w-full gap-2 rounded-xl",
              })}
            >
              Lihat pilihan program <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding?mode=program"
              className="mt-2 flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4"
            >
              Sudah punya kode program?
            </Link>
          </section>
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{date}</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Selamat datang, {access.full_name.split(" ")[0]}.
                </h1>
              </div>
              <Link
                href="/panduan"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-navy-900"
              >
                Panduan <ArrowRight className="h-4 w-4" />
              </Link>
            </header>
            <section
              className="overflow-hidden rounded-2xl bg-navy-900 p-5 text-white sm:p-7"
              aria-label="Masa uji coba"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-200 sm:text-sm">
                    Spiritual · Gratis 14 hari
                  </p>
                  <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-3xl">
                    Satu langkah baik hari ini.
                  </h2>
                  <p className="mt-2 max-w-lg text-xs leading-6 text-blue-100 sm:text-sm">
                    Catat ibadah dan temukan pelajaran dari keseharian Anda.
                  </p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <p className="text-[10px] text-blue-200 sm:text-xs">
                    Hari ke
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
                    {progress.day}
                    <span className="ml-1 text-xs font-normal text-blue-200">
                      / 14
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#DAB568]"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-blue-200">
                {progress.remainingDays} hari tersisa · Berakhir{" "}
                {new Intl.DateTimeFormat("id-ID", {
                  timeZone: zone,
                  day: "numeric",
                  month: "short",
                }).format(new Date(access.expires_at!))}
              </p>
            </section>

            <section aria-labelledby="daily-title">
              <div className="mb-4">
                <h2
                  id="daily-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  Ruang ibadah hari ini
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pilih aktivitas yang ingin Anda catat.
                </p>
              </div>
              <div
                className="mb-5 grid grid-cols-4 gap-2"
                role="group"
                aria-label="Pilih aktivitas"
              >
                {activities.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActivity(item.id)}
                    aria-pressed={activity === item.id}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-1 text-xs font-medium sm:text-sm ${activity === item.id ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
                  >
                    <item.icon aria-hidden className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
                <div
                  key={`${activity}-${getLocalDateString(new Date(now), zone)}`}
                >
                  {activity === "prayer" && (
                    <PrayerTracker
                      userId={access.user_id}
                      view="today"
                      timeZone={zone}
                      accountCreatedDate={getLocalDateString(
                        new Date(access.starts_at!),
                        zone,
                      )}
                    />
                  )}
                  {activity === "quran" && (
                    <QuranTracker userId={access.user_id} timeZone={zone} />
                  )}
                  {activity === "hadith" && (
                    <DailyHadithWidget
                      userId={access.user_id}
                      timeZone={zone}
                    />
                  )}
                  {activity === "reflection" && (
                    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                      <PenLine className="h-6 w-6 text-navy-900" />
                      <h3 className="mt-4 text-lg font-semibold">
                        Apa yang Anda syukuri hari ini?
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Tuliskan pengalaman, pelajaran, atau niat baik untuk
                        esok. Jurnal membantu Anda melihat perubahan dari hari
                        ke hari.
                      </p>
                      <Link
                        href="/journal"
                        className={buttonVariants({
                          className: "mt-5 gap-2 rounded-xl",
                        })}
                      >
                        Buka jurnal refleksi <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
                <PrayerTimesWidget
                  location={access.location || "Jakarta"}
                  timeZone={zone}
                />
              </div>
            </section>

            <section
              aria-labelledby="areas-title"
              className="border-t border-slate-200 pt-7"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    id="areas-title"
                    className="text-xl font-semibold tracking-tight"
                  >
                    Perjalanan Anda bisa berlanjut.
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Kenali area lain dalam program pendampingan.
                  </p>
                </div>
                <Link
                  href="/#pricing"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                >
                  Pilihan program <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {areas.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => setPreview(area)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <area.icon className="h-5 w-5 text-slate-500" />
                      <LockKeyhole
                        className="h-3.5 w-3.5 text-slate-400"
                        aria-hidden
                      />
                    </div>
                    <span className="block text-sm font-medium">
                      {area.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Pratinjau program
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.description}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-7 text-slate-600">
            Area ini tersedia dalam program pendampingan. Selama uji coba, Anda
            dapat menggunakan ruang ibadah dan jurnal refleksi.
          </p>
          <Link
            href="/#pricing"
            className={buttonVariants({
              className: "mt-5 w-full gap-2 rounded-xl",
            })}
          >
            Lihat pilihan program <ArrowRight className="h-4 w-4" />
          </Link>
        </DialogContent>
      </Dialog>
    </ParticipantLayout>
  );
}
