"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { calculateAreaOutcome, calculateIndicatorOutcome } from "@/lib/assessment-methodology";
import { createClient } from "@/lib/supabase/client";

type TrialResult = {
  reviews: { month_number: number; participant_note: string | null }[];
  indicators: {
    id: string;
    label: string;
    active: boolean;
    baseline_value: number;
    target_value: number;
    direction: "higher_is_better" | "lower_is_better";
  }[];
  actuals: { month_number: number; indicator_id: string; actual_value: number; evidence_note: string | null }[];
  reflection: string | null;
};

export default function TrialResultPage() {
  const supabase = createClient();
  const [result, setResult] = useState<TrialResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const { data, error: cause } = await supabase.rpc("get_slj_trial_result");
        if (cause) throw cause;
        if (current) setResult(data);
      } catch {
        if (current) setError(true);
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [supabase, retry]);

  return (
    <ParticipantLayout pageTitle="Hasil uji coba" hideBackToHome>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <Link href="/profile" className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke profil
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Hasil uji coba 14 hari</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Capaian terhadap target Spiritual Growth dan catatan dari dua pekan latihan Anda.</p>
        </header>
        {loading ? (
          <p role="status" className="text-sm text-slate-600">Memuat hasil…</p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            Hasil belum dapat dimuat.
            <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 min-h-11 font-semibold underline">
              Coba lagi
            </button>
          </div>
        ) : !result ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">Belum ada hasil uji coba untuk akun ini.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map(week => {
                const review = result.reviews.find(item => item.month_number === week);
                const measured = result.indicators.filter(indicator => indicator.active).flatMap(indicator => {
                  const actual = result.actuals.find(item => item.month_number === week && item.indicator_id === indicator.id);
                  if (!actual) return [];
                  return [{
                    ...calculateIndicatorOutcome({
                      baseline: indicator.baseline_value,
                      target: indicator.target_value,
                      actual: actual.actual_value,
                      direction: indicator.direction,
                    }),
                    id: indicator.id,
                    label: indicator.label,
                    note: actual.evidence_note,
                  }];
                });
                const score = calculateAreaOutcome(measured).score;
                return (
                  <section key={week} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-base font-semibold text-navy-900">Pekan {week}</h2>
                      <span className="text-xs text-slate-600">{week === 1 ? "Hari 1–7" : "Hari 8–14"}</span>
                    </div>
                    {score === null ? (
                      <p className="text-sm text-slate-600">Belum ada capaian tercatat.</p>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-600">Capaian target</p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-navy-900">{Math.round(score)}%</p>
                      </div>
                    )}
                    {measured.length > 0 && (
                      <dl className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                        {measured.map(indicator => (
                          <div key={indicator.id}>
                            <div className="flex flex-wrap justify-between gap-2">
                              <dt className="break-words text-slate-700">{indicator.label}</dt>
                              <dd className="font-medium text-navy-900">{indicator.score === null ? "—" : Math.round(indicator.score) + "%"}</dd>
                            </div>
                            {indicator.note && <dd className="break-words text-xs leading-5 text-slate-600">{indicator.note}</dd>}
                          </div>
                        ))}
                      </dl>
                    )}
                    {review?.participant_note && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold text-slate-600">Catatan Anda</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{review.participant_note}</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            {result.reflection && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-semibold text-navy-900">Refleksi akhir</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{result.reflection}</p>
              </section>
            )}
          </>
        )}
      </div>
    </ParticipantLayout>
  );
}
