"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TRIAL_DAYS } from "@/lib/program-access";

const PAGE_SIZE = 20;

const statuses = {
  active: { label: "Aktif", tone: "bg-emerald-50 text-emerald-800" },
  paused: { label: "Dijeda", tone: "bg-amber-50 text-amber-900" },
  expired: { label: "Berakhir", tone: "bg-slate-100 text-slate-700" },
  program: { label: "Lanjut program", tone: "bg-blue-50 text-navy-900" },
} as const;

type TrialStatus = keyof typeof statuses;
type StatusFilter = TrialStatus | "all";
type Settings = { enabled: boolean; signup_until: string | null };
type Participant = {
  user_id: string;
  full_name: string;
  starts_at: string;
  expires_at: string;
  status: TrialStatus;
  trial_day: number | null;
  active_days: number | null;
  last_activity_at: string | null;
  week_1_submitted: boolean | null;
  week_2_submitted: boolean | null;
};
type Workspace = {
  settings: Settings;
  counts: Record<StatusFilter, number>;
  filtered_total: number;
  participants: Participant[];
};
type AccessEvent = {
  id: string;
  actor_name: string;
  paused: boolean;
  reason: string;
  created_at: string;
};

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function formatTime(value: string) {
  return dateTime.format(new Date(value)) + " WIB";
}

function localInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function TrialBadge({ status }: { status: TrialStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statuses[status].tone,
      )}
    >
      {statuses[status].label}
    </span>
  );
}

function trialDay(participant: Participant) {
  return participant.trial_day === null
    ? "Tidak tersedia"
    : "Hari " + participant.trial_day + "/" + TRIAL_DAYS;
}

function activityDays(participant: Participant) {
  return participant.active_days === null
    ? "Tidak tersedia"
    : participant.active_days + " hari";
}

function evaluationLabel(participant: Participant, week: 1 | 2) {
  const submitted =
    week === 1 ? participant.week_1_submitted : participant.week_2_submitted;
  if (submitted === null) return "Tidak tersedia";
  if (submitted) return "Tersimpan";
  if (week === 2 && participant.trial_day !== null && participant.trial_day < 8)
    return participant.status === "program"
      ? "Belum dimulai"
      : "Belum waktunya";
  return "Belum diisi";
}

function Registration({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: (settings: Settings) => void;
}) {
  const supabase = createClient();
  const [draft, setDraft] = useState<{
    enabled: boolean;
    deadline: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const form = draft ?? {
    enabled: settings.enabled,
    deadline: localInput(settings.signup_until),
  };
  const closed =
    !settings.enabled ||
    Boolean(
      settings.signup_until && Date.parse(settings.signup_until) <= Date.now(),
    );

  function updateDraft(next: Partial<typeof form>) {
    setDraft({ ...form, ...next });
    setFeedback(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.rpc("admin_set_slj_trial_offer", {
        p_enabled: form.enabled,
        p_signup_until: form.deadline
          ? new Date(form.deadline).toISOString()
          : null,
      });
      if (error || !data?.settings) throw error ?? new Error();
      onSaved(data.settings);
      setDraft(null);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-900 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-sm font-semibold">
          Pendaftaran peserta baru
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            closed ? statuses.expired.tone : statuses.active.tone,
          )}
        >
          {closed ? "Ditutup" : "Dibuka"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-600 group-open:rotate-180"
        />
      </summary>
      <form
        onSubmit={save}
        className="grid gap-4 border-t border-slate-100 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                updateDraft({ enabled: event.target.checked })
              }
              disabled={busy}
              className="size-5 shrink-0 accent-navy-900"
            />
            Buka pendaftaran uji coba
          </label>
          <p className="max-w-md text-pretty text-sm leading-6 text-slate-600">
            Peserta yang sudah mulai bisa menggunakan sisa masa uji cobanya saat
            pendaftaran ditutup.
          </p>
          <Link
            href="/panduan"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy-900 underline-offset-4 hover:underline"
          >
            Panduan peserta{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div>
          <Input
            type="datetime-local"
            label="Tutup pendaftaran pada (opsional)"
            value={form.deadline}
            onChange={(event) => updateDraft({ deadline: event.target.value })}
            disabled={busy}
            aria-describedby="trial-deadline-help"
          />
          <p
            id="trial-deadline-help"
            className="mt-1.5 text-xs leading-5 text-slate-600"
          >
            Waktu mengikuti zona perangkat Anda. Biarkan kosong jika pendaftaran
            dibuka tanpa tenggat.
          </p>
          <Button type="submit" disabled={busy || !draft} className="mt-3">
            {busy ? "Menyimpan…" : "Simpan pengaturan"}
          </Button>
          {feedback === "saved" && (
            <p role="status" className="mt-2 text-sm text-emerald-800">
              Pengaturan tersimpan.
            </p>
          )}
          {feedback === "error" && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Pengaturan belum tersimpan. Silakan coba lagi.
            </p>
          )}
        </div>
      </form>
    </details>
  );
}

function ParticipantDetail({
  participant,
  onClose,
  onChanged,
}: {
  participant: Participant;
  onClose: () => void;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [status, setStatus] = useState(participant.status);
  const [history, setHistory] = useState<AccessEvent[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const canManage = status === "active" || status === "paused";
  const willPause = status === "active";
  const actionLabel = willPause ? "Jeda akses" : "Pulihkan akses";

  useEffect(() => {
    let current = true;
    async function loadHistory() {
      setHistoryError(false);
      try {
        const { data, error } = await supabase.rpc(
          "admin_slj_trial_access_history",
          {
            p_user_id: participant.user_id,
          },
        );
        if (error) throw error;
        if (current) setHistory(data);
      } catch {
        if (current) setHistoryError(true);
      }
    }
    void loadHistory();
    return () => {
      current = false;
    };
  }, [participant.user_id, revision, supabase]);

  async function changeAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reason.trim().length < 3) return;
    setBusy(true);
    setError("");
    setConfirmation("");
    try {
      const { error } = await supabase.rpc("admin_slj_set_trial_pause", {
        p_user_id: participant.user_id,
        p_paused: willPause,
        p_reason: reason.trim(),
      });
      if (error) {
        if (error.code === "22023" || error.code === "42501") {
          setError(error.message);
          onChanged();
          return;
        }
        throw error;
      }
      setStatus(willPause ? "paused" : "active");
      setConfirmation(
        willPause ? "Akses uji coba dijeda." : "Akses uji coba dipulihkan.",
      );
      setEditing(false);
      setReason("");
      setHistory(null);
      setRevision((value) => value + 1);
      onChanged();
    } catch {
      setError("Akses belum berhasil diperbarui. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="max-w-xl"
        aria-describedby="trial-detail-description"
        onCloseAutoFocus={(event) => {
          const target =
            document.getElementById("trial-member-" + participant.user_id) ??
            document.getElementById("trial-participants-title");
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="break-words text-balance">
            {participant.full_name}
          </DialogTitle>
          <DialogDescription id="trial-detail-description">
            Hari aktif dihitung dari pencatatan aktivitas dalam periode 24 jam
            sejak uji coba dimulai.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <TrialBadge status={status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3 text-sm sm:p-4">
          {[
            ["Mulai uji coba", formatTime(participant.starts_at)],
            ["Batas akses awal", formatTime(participant.expires_at)],
            ["Masa uji coba", trialDay(participant)],
            ["Hari aktif", activityDays(participant)],
            ["Evaluasi pekan 1", evaluationLabel(participant, 1)],
            ["Evaluasi pekan 2", evaluationLabel(participant, 2)],
            [
              "Aktivitas terakhir",
              participant.last_activity_at
                ? formatTime(participant.last_activity_at)
                : participant.active_days === null
                  ? "Tidak tersedia"
                  : "Belum tercatat",
            ],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="mt-1 break-words font-medium tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {canManage && (
          <div className="mt-5">
            {editing ? (
              <form
                onSubmit={changeAccess}
                className="space-y-3 rounded-xl border border-slate-200 p-4"
              >
                <h3 className="text-sm font-semibold">
                  {actionLabel} uji coba
                </h3>
                <p className="text-pretty text-sm leading-6 text-slate-600">
                  {willPause
                    ? "Peserta masih bisa melihat hasil yang tersimpan. Pengisian aktivitas dan pengingat berhenti selama akses dijeda."
                    : "Peserta dapat melanjutkan aktivitas dan menerima pengingat sesuai pengaturannya hingga batas akses."}
                </p>
                <p className="text-sm font-medium">
                  Batas akses {formatTime(participant.expires_at)}.
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="trial-access-reason"
                    className="block text-sm font-semibold"
                  >
                    Alasan tindakan
                  </label>
                  <textarea
                    id="trial-access-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Contoh: Perlu memeriksa akses akun"
                    rows={2}
                    maxLength={300}
                    required
                    disabled={busy}
                    aria-describedby="trial-access-reason-help"
                    className="block min-h-20 w-full rounded-lg border border-warm-border px-3 py-2 text-base focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 sm:text-sm"
                  />
                  <p
                    id="trial-access-reason-help"
                    className="text-xs text-slate-600"
                  >
                    3–300 karakter. Hanya terlihat di riwayat admin.
                  </p>
                </div>
                {error && (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                )}
                <DialogFooter className="mt-0">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setReason("");
                      setError("");
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy || reason.trim().length < 3}
                  >
                    {busy
                      ? "Menyimpan…"
                      : "Konfirmasi " + actionLabel.toLowerCase()}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(true);
                  setConfirmation("");
                }}
              >
                {actionLabel}
              </Button>
            )}
          </div>
        )}
        {confirmation && (
          <p role="status" className="mt-3 text-sm text-emerald-800">
            {confirmation}
          </p>
        )}

        <section className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold">Riwayat akses</h3>
          {historyError ? (
            <div role="alert" className="mt-2 text-sm text-red-700">
              Riwayat belum dapat dimuat.{" "}
              <button
                className="min-h-11 font-semibold underline underline-offset-4"
                onClick={() => setRevision((value) => value + 1)}
              >
                Coba lagi
              </button>
            </div>
          ) : !history ? (
            <p role="status" className="mt-2 text-sm text-slate-600">
              Memuat riwayat…
            </p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Belum ada tindakan admin untuk peserta ini.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {history.map((event) => (
                <li key={event.id} className="py-2.5 text-sm">
                  <p className="font-medium">
                    {event.paused ? "Akses dijeda" : "Akses dipulihkan"}
                  </p>
                  <p className="mt-0.5 break-words text-xs leading-5 text-slate-600">
                    {event.actor_name} · {formatTime(event.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">
                    {event.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

export default function TrialAdminPage() {
  const supabase = createClient();
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState<{
    search: string;
    status: StatusFilter;
    page: number;
  }>({
    search: "",
    status: "all",
    page: 1,
  });
  const [selected, setSelected] = useState<Participant | null>(null);

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: result, error } = await supabase.rpc(
          "admin_slj_trial_workspace",
          {
            p_search: query.search,
            p_status: query.status,
            p_limit: PAGE_SIZE,
            p_offset: (query.page - 1) * PAGE_SIZE,
          },
        );
        if (!current) return;
        if (error?.code === "PGRST202") {
          setError(
            "Dashboard uji coba memerlukan pembaruan database SLJ. Perbarui halaman setelah pembaruan selesai.",
          );
          return;
        }
        if (error || !result) throw error ?? new Error();
        const lastPage = Math.max(
          1,
          Math.ceil(result.filtered_total / PAGE_SIZE),
        );
        if (query.page > lastPage) {
          setQuery((value) => ({ ...value, page: lastPage }));
          return;
        }
        setData(result);
      } catch {
        if (current)
          setError("Daftar peserta belum dapat dimuat. Silakan coba lagi.");
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [query, revision, supabase]);

  const filtered = query.status !== "all" || Boolean(query.search);
  const refresh = () => setRevision((value) => value + 1);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
        <h1 className="text-balance text-2xl font-semibold sm:text-3xl">
          Uji coba spiritual
        </h1>
        <Button
          type="button"
          aria-label="Perbarui"
          title="Perbarui"
          variant="secondary"
          onClick={refresh}
          disabled={loading}
          className="size-11 gap-2 px-0 sm:w-auto sm:px-4"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">Perbarui</span>
        </Button>
        <p className="col-span-2 text-pretty text-sm leading-6 text-slate-600">
          Pantau latihan peserta dan kelola akses uji coba 14 hari.
        </p>
      </header>

      {data && (
        <>
          <dl
            aria-label="Ringkasan peserta"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-5"
          >
            {(["all", "active", "paused", "expired", "program"] as const).map(
              (status) => (
                <div
                  key={status}
                  className={cn(
                    "bg-white px-4 py-3.5 sm:px-5",
                    status === "all" && "col-span-2 bg-slate-50 md:col-span-1",
                  )}
                >
                  <dt className="text-xs font-medium text-slate-600">
                    {status === "all"
                      ? "Total peserta"
                      : statuses[status].label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.counts[status]}
                  </dd>
                </div>
              ),
            )}
          </dl>
          <Registration
            settings={data.settings}
            onSaved={(settings) =>
              setData((value) => (value ? { ...value, settings } : value))
            }
          />
        </>
      )}

      <section
        aria-labelledby="trial-participants-title"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <h2
          id="trial-participants-title"
          tabIndex={-1}
          className="text-lg font-semibold"
        >
          Peserta uji coba
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery((value) => ({
              ...value,
              search: searchInput.trim(),
              page: 1,
            }));
          }}
          className="mt-4 flex flex-col items-end gap-3 sm:flex-row"
        >
          <div className="flex w-full min-w-0 flex-1 items-end gap-2">
            <Input
              label="Cari nama peserta"
              type="search"
              placeholder="Nama peserta"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={120}
            />
            <Button type="submit" variant="secondary" className="h-11 gap-1.5">
              <Search aria-hidden="true" className="hidden size-4 sm:block" />{" "}
              Cari
            </Button>
          </div>
          <label className="w-full space-y-1.5 sm:w-48">
            <span className="block text-sm font-medium">Status akses</span>
            <select
              value={query.status}
              onChange={(event) =>
                setQuery({
                  status: event.target.value as StatusFilter,
                  search: searchInput.trim(),
                  page: 1,
                })
              }
              className="h-11 w-full rounded-lg border border-warm-border bg-white px-3 text-base focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 sm:text-sm"
            >
              <option value="all">Semua status</option>
              {Object.entries(statuses).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </form>
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : loading ? (
          <div
            role="status"
            className="mt-4 border-t border-slate-100 py-6 text-sm text-slate-600"
          >
            <span>Memuat peserta…</span>
            <div
              aria-hidden="true"
              className="mt-4 grid grid-cols-3 gap-4 motion-safe:animate-pulse"
            >
              <span className="h-8 rounded-lg bg-slate-100" />
              <span className="h-8 rounded-lg bg-slate-100" />
              <span className="h-8 rounded-lg bg-slate-100" />
            </div>
          </div>
        ) : data?.participants.length ? (
          <>
            <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-200">
              {data.participants.map((participant) => (
                <li
                  key={participant.user_id}
                  className="grid items-center gap-x-4 gap-y-3 py-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto]"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 lg:block">
                    <h3 className="min-w-0 break-words text-sm font-semibold">
                      {participant.full_name}
                    </h3>
                    <div className="lg:mt-1.5">
                      <TrialBadge status={participant.status} />
                    </div>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium tabular-nums">
                      {trialDay(participant)} ·{" "}
                      {participant.active_days === null
                        ? "Aktivitas tidak tersedia"
                        : activityDays(participant) + " aktif"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {participant.last_activity_at
                        ? "Terakhir " + formatTime(participant.last_activity_at)
                        : participant.active_days === null
                          ? ""
                          : "Belum ada aktivitas tercatat"}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-1 lg:gap-1">
                    {([1, 2] as const).map((week) => (
                      <div key={week} className="flex flex-wrap gap-x-1.5">
                        <dt className="text-slate-600">Pekan {week}</dt>
                        <dd className="font-medium">
                          {evaluationLabel(participant, week)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <Button
                    type="button"
                    variant="ghost"
                    id={"trial-member-" + participant.user_id}
                    onClick={() => setSelected(participant)}
                    className="w-fit gap-1 px-0 hover:bg-transparent hover:underline hover:underline-offset-4 lg:px-2"
                    aria-label={"Lihat progres " + participant.full_name}
                  >
                    Lihat progres{" "}
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <nav
              aria-label="Halaman peserta"
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 pt-3"
            >
              <p className="text-sm tabular-nums text-slate-600">
                {(query.page - 1) * PAGE_SIZE + 1}–
                {(query.page - 1) * PAGE_SIZE + data.participants.length} dari{" "}
                {data.filtered_total} peserta
              </p>
              {data.filtered_total > PAGE_SIZE && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    size="sm"
                    disabled={query.page === 1}
                    onClick={() =>
                      setQuery((value) => ({ ...value, page: value.page - 1 }))
                    }
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    size="sm"
                    disabled={query.page * PAGE_SIZE >= data.filtered_total}
                    onClick={() =>
                      setQuery((value) => ({ ...value, page: value.page + 1 }))
                    }
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </nav>
          </>
        ) : (
          <div className="mt-4 border-t border-slate-100 py-8 text-center text-sm text-slate-600">
            <p>
              {filtered
                ? "Tidak ada peserta yang cocok dengan pencarian."
                : "Belum ada peserta yang memulai uji coba."}
            </p>
            {filtered && (
              <Button
                type="button"
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setSearchInput("");
                  setQuery({ search: "", status: "all", page: 1 });
                }}
              >
                Hapus filter
              </Button>
            )}
          </div>
        )}
      </section>
      {selected && (
        <ParticipantDetail
          key={selected.user_id}
          participant={selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
