"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatSupabaseError } from "@/lib/company-store";

type TrialOverview = {
  settings: { enabled: boolean; signup_until: string | null };
  total: number;
  active: number;
  participants: {
    user_id: string;
    full_name: string;
    starts_at: string;
    expires_at: string;
    status: string;
  }[];
};
function localInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function TrialAdminPage() {
  const supabase = createClient();
  const [data, setData] = useState<TrialOverview | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setSaved(false);
      const { data: result, error: failure } = await supabase.rpc(
        "admin_slj_trial_overview",
      );
      if (cancelled) return;
      if (failure)
        setError(
          failure.code === "PGRST202"
            ? "Pengaturan trial belum tersedia. Selesaikan pembaruan database SLJ, lalu perbarui halaman ini."
            : "Data uji coba belum dapat dimuat. Silakan coba lagi.",
        );
      else {
        setData(result);
        setEnabled(result.settings.enabled);
        setDeadline(localInput(result.settings.signup_until));
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, revision]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const { data: result, error: failure } = await supabase.rpc(
        "admin_set_slj_trial_offer",
        {
          p_enabled: enabled,
          p_signup_until: deadline ? new Date(deadline).toISOString() : null,
        },
      );
      if (failure) throw failure;
      setData(result);
      setSaved(true);
    } catch (cause) {
      setError(formatSupabaseError(cause, "Pengaturan belum tersimpan."));
    } finally {
      setBusy(false);
    }
  }
  const format = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  const closed =
    data &&
    (!data.settings.enabled ||
      Boolean(
        data.settings.signup_until &&
          Date.parse(data.settings.signup_until) <= Date.now(),
      ));

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
            Uji coba spiritual
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kelola pendaftaran gratis 14 hari dan pantau peserta yang sudah
            memulai.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setRevision((value) => value + 1)}
          disabled={loading || busy}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
          Perbarui
        </Button>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">
          Memuat peserta trial…
        </p>
      ) : (
        data && (
          <>
            <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <form
                onSubmit={save}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    Pendaftaran peserta baru
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${closed ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}
                  >
                    {closed ? "Ditutup" : "Dibuka"}
                  </span>
                </div>
                <label className="my-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                    disabled={busy}
                    className="h-5 w-5 accent-[#0B2C6B]"
                  />
                  Buka pendaftaran uji coba
                </label>
                <Input
                  type="datetime-local"
                  label="Tutup pendaftaran pada (opsional)"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  disabled={busy}
                />
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  Kosongkan untuk tetap membuka pendaftaran. Waktu mengikuti
                  zona perangkat Anda. Menutup pendaftaran tidak memotong masa
                  trial peserta yang sudah aktif.
                </p>
                <Button
                  type="submit"
                  disabled={busy}
                  className="mt-5 rounded-xl"
                >
                  {busy ? "Menyimpan…" : "Simpan pengaturan"}
                </Button>
                {saved && (
                  <p role="status" className="mt-3 text-sm text-emerald-800">
                    Pengaturan tersimpan.
                  </p>
                )}
              </form>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold">Ringkasan peserta</h2>
                <dl className="mt-6 grid grid-cols-2 gap-5">
                  <div>
                    <dt className="text-sm text-slate-600">Sedang trial</dt>
                    <dd className="mt-2 text-4xl font-semibold tabular-nums">
                      {data.active}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-600">Pernah memulai</dt>
                    <dd className="mt-2 text-4xl font-semibold tabular-nums">
                      {data.total}
                    </dd>
                  </div>
                </dl>
                <p className="mt-6 text-sm leading-7 text-slate-600">
                  Setiap akun mendapat satu kali trial. Akses spiritual berakhir
                  14 hari setelah aktivasi. Untuk melanjutkan ke program,
                  berikan kode program melalui menu Batch program.
                </p>
                <Link
                  href="/panduan"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-navy-900"
                >
                  Panduan untuk dibagikan <ArrowUpRight className="h-4 w-4" />
                </Link>
              </section>
            </div>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Peserta trial</h2>
              <p className="mt-1 text-sm text-slate-600">
                {data.total > 50
                  ? "Menampilkan 50 peserta yang terakhir memulai trial."
                  : "Peserta yang sudah mengaktifkan trial, termasuk yang masa aksesnya berakhir."}
              </p>
              {!data.participants?.length ? (
                <p className="py-12 text-center text-sm text-slate-600">
                  Belum ada peserta yang memulai trial.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-slate-100">
                  {data.participants.map((participant) => (
                    <li
                      key={participant.user_id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold">
                          {participant.full_name}
                        </h3>
                        <p className="mt-1 text-xs leading-6 text-slate-600">
                          Mulai {format(participant.starts_at)}
                          <br />
                          Berakhir {format(participant.expires_at)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${participant.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                      >
                        {participant.status === "active"
                          ? "Sedang trial"
                          : participant.status === "program"
                            ? "Lanjut program"
                            : "Trial berakhir"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
