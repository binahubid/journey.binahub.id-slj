"use client";

import { useEffect, useState } from "react";
import { ParticipantDashboard } from "@/components/domain/ParticipantDashboard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Pause } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getSljAccess,
  getTrialProgress,
  type SljAccess,
} from "@/lib/program-access";
import {
  resolveParticipantTimeZone,
} from "@/lib/local-date";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { ParticipantPageSkeleton } from "@/components/layout/ParticipantPageSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";

export default function TrialPage() {
  const supabase = createClient();
  const router = useRouter();
  const [access, setAccess] = useState<SljAccess | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
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
        if (markActive && data.active)
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
  if (access?.active && progress && !progress.expired && !progress.paused) {
    return <ParticipantDashboard trialAccess={access} />;
  }

  if (!access && !error) return <ParticipantPageSkeleton kind="trial" />;

  return (
    <ParticipantLayout
      activePath="/trial"
      pageTitle="Perjalanan spiritual"
      hideBackToHome
      hideFooter
      trialExpired={progress?.expired || progress?.paused}
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
        ) : progress.paused ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-8 sm:p-10">
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
              <Pause aria-hidden="true" className="size-6" />
            </span>
            <h1 className="text-balance text-2xl font-semibold text-navy-900 sm:text-3xl">
              Akses uji coba dijeda
            </h1>
            <p className="mt-3 text-pretty text-sm leading-6 text-slate-600">
              Hasil latihan Anda masih bisa dilihat. Hubungi tim BinaHub jika perlu bantuan untuk melanjutkan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/trial/result" className={buttonVariants({ className: "gap-2 rounded-xl" })}>
                Lihat hasil uji coba <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Button variant="secondary" onClick={() => setRetry((value) => value + 1)} className="rounded-xl">
                Periksa akses
              </Button>
            </div>
          </section>
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
              href="/trial/result"
              className={buttonVariants({
                className: "mt-7 w-full gap-2 rounded-xl",
              })}
            >
              Lihat hasil 14 hari <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-slate-50"
            >
              Lihat pilihan program
            </Link>
            <Link
              href="/onboarding?mode=program"
              className="mt-2 flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4"
            >
              Sudah punya kode program?
            </Link>
          </section>
        ) : null}
      </div>
    </ParticipantLayout>
  );
}
