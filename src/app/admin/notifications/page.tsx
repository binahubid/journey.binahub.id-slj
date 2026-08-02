"use client";

import { useEffect, useState } from "react";
import { Bell, Send, CheckCircle2, Building2, Layers, UserCheck, Users, ShieldAlert, Activity, RefreshCw } from "lucide-react";
import {
  fetchCompaniesFromSupabase,
  fetchBatchesFromSupabase,
  fetchCoachesFromSupabase,
  fetchAdminBroadcastHistory,
  sendAdminBroadcastNotification,
  BroadcastNotification,
  Company,
  Batch,
  AdminCoach,
} from "@/lib/company-store";
import { formatSupabaseError } from "@/lib/company-store";
import { AutomationResult, BroadcastScope, RawMonitoringRow } from "@/lib/admin-types";

type AdminParticipant = { id: string; name: string; companyName: string; email: string; participantCount?: number };
import { createClient } from "@/lib/supabase/client";

interface MonitoringAlert {
  id: string;
  user_id: string;
  coach_id: string | null;
  alert_type: string;
  message: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [sentList, setSentList] = useState<BroadcastNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<BroadcastScope>("all");
  const [targetId, setTargetId] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monitoring alerts state
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationResult, setAutomationResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadTargets() {
      setLoadingHistory(true);
      try {
        const [compList, batchList, coachList, partRes, history] = await Promise.all([
          fetchCompaniesFromSupabase(),
          fetchBatchesFromSupabase(),
          fetchCoachesFromSupabase(),
          supabase.rpc("get_admin_monitoring", { p_limit: 1000, p_offset: 0 }),
          fetchAdminBroadcastHistory(),
        ]);
        if (partRes.error) throw partRes.error;
        setCompanies(compList);
        setBatches(batchList);
        setCoaches(coachList);
        setParticipants(
          (partRes.data || []).map((r: RawMonitoringRow) => ({
            id: r.user_id,
            name: r.full_name || "Peserta",
            companyName: r.company_name || "",
            email: r.full_name || "Peserta",
            participantCount: 0,
          }))
        );
        setSentList(history);
      } catch (err: any) {
        setErrorMsg(formatSupabaseError(err, "Gagal memuat data notifikasi."));
      } finally {
        setLoadingHistory(false);
      }
    }
    loadTargets();
  }, [supabase]);

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("monitoring_alerts")
        .select("id, user_id, coach_id, alert_type, message, status, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Error loading alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleRunAutomation = async () => {
    setRunningAutomation(true);
    setAutomationResult(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("run_monitoring_automation");
      if (error) throw error;
      const result = data as AutomationResult;
      setAutomationResult(
        `Selesai: ${result?.locked_ptps || 0} PTP terkunci, ${result?.inactivity_alerts || 0} alert inaktivitas, ${result?.coach_response_alerts || 0} alert respons coach.`
      );
      await loadAlerts();
      setTimeout(() => setAutomationResult(null), 6000);
    } catch (err: any) {
      setAutomationResult(formatSupabaseError(err, "Gagal menjalankan automasi monitoring."));
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("monitoring_alerts")
        .update({ status: "RESOLVED", resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "RESOLVED", resolved_at: new Date().toISOString() } : a))
      );
    } catch (err) {
      console.error("Error resolving alert:", err);
      setErrorMsg(formatSupabaseError(err, "Gagal menandai alert sebagai selesai."));
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    if (scope !== "all" && !targetId) {
      setErrorMsg("Pilih target broadcast terlebih dahulu.");
      return;
    }

    setSending(true);
    setErrorMsg(null);

    let targetLabel = "Semua Perusahaan & Peserta";

    if (scope === "company") {
      const comp = companies.find((c) => c.id === targetId);
      targetLabel = comp ? `Perusahaan: ${comp.name}` : "Perusahaan";
    } else if (scope === "batch") {
      const b = batches.find((item) => item.id === targetId);
      targetLabel = b ? `Batch: ${b.companyName} — ${b.name}` : "Batch";
    } else if (scope === "coach") {
      const c = coaches.find((item) => item.id === targetId);
      targetLabel = c ? `Kelompok Bimbingan: ${c.name}` : "Coach";
    } else if (scope === "participant") {
      const p = participants.find((item) => item.id === targetId);
      targetLabel = p ? `Peserta Spesifik: ${p.name}` : "Peserta";
    }

    const sent = await sendAdminBroadcastNotification({
      title,
      message,
      targetScope: scope,
      targetId,
    });
    if (!sent) {
      setErrorMsg("Broadcast belum terkirim. Tidak ada riwayat lokal yang dibuat.");
      setSending(false);
      return;
    }

    // Muat ulang riwayat canonical dari database
    const history = await fetchAdminBroadcastHistory();
    setSentList(history);
    setTitle("");
    setMessage("");
    setSending(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="border-b border-[#EAE5D9] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
          <Bell className="h-7 w-7 text-[#C79A3C]" /> Broadcast Notification System
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Kirim pengumuman / reminder secara terarah ke seluruh entitas atau grup spesifik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Composer */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-5 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
            <Send className="h-4 w-4 text-[#C79A3C]" /> Buat Broadcast Baru
          </h2>

          {sentSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Notifikasi berhasil dikirimkan ke target audiens!</span>
            </div>
          )}
          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Target Scope Selection (As requested) */}
            <div>
              <label className="block text-xs font-bold text-[#071A33] mb-1.5">Target Audiens (Scope Broadcast)</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as BroadcastScope);
                  setTargetId("");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
              >
                <option value="all">All Companies (Seluruh Perusahaan & Peserta)</option>
                <option value="company">Per Perusahaan (Company tertentu)</option>
                <option value="batch">Per Batch Rombongan tertentu</option>
                <option value="coach">Per Coach tertentu</option>
                <option value="participant">Participant tertentu (Individu)</option>
              </select>
            </div>

            {/* Dynamic Target Selection based on Scope */}
            {scope === "company" && (
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Pilih Perusahaan</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  <option value="">Pilih perusahaan...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.participantCount} Peserta)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === "batch" && (
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Pilih Batch</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  <option value="">Pilih batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.companyName} — {b.name} ({b.accessCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === "coach" && (
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Pilih Coach</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  <option value="">Pilih coach...</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.participantCount} Peserta bimbingan)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === "participant" && (
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Pilih Peserta Spesifik</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  <option value="">Pilih peserta...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.companyName} - {p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#071A33] mb-1">Judul Notifikasi</label>
              <input
                type="text"
                required
                placeholder="Misal: Pengingat Checkpoint 1 Bulanan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A33] mb-1">Isi Pesan Broadcast</label>
              <textarea
                rows={4}
                required
                placeholder="Tulis pesan pengumuman atau instruksi..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="h-4 w-4 text-[#C79A3C]" /> {sending ? "Mengirim..." : "Kirim Broadcast Notifikasi"}
            </button>
          </form>
        </div>

        {/* Right Column: Broadcast History */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-5 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#C79A3C]" /> Riwayat Broadcast Terkirim
          </h2>
          {loadingHistory && <p className="text-xs text-slate-500">Memuat riwayat dari database...</p>}

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {sentList.length === 0 && !loadingHistory ? (
              <p className="text-xs text-slate-500">Belum ada broadcast tercatat.</p>
            ) : null}
            {sentList.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4]/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#071A33] text-sm">{item.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {item.recipientCount} Penerima
                  </span>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed">{item.message}</p>
                <div className="pt-2 flex items-center justify-between border-t border-[#EAE5D9]/60 text-[11px] text-slate-400 font-medium">
                  <span>Target: <strong className="text-[#0B2C6B]">{item.targetLabel}</strong></span>
                  <span>{item.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monitoring Alerts Section */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#C79A3C]" /> Monitoring Alerts (Otomatis)
          </h2>
          <button
            onClick={handleRunAutomation}
            disabled={runningAutomation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EAE5D9] bg-white hover:bg-[#FAF8F4] text-xs font-bold text-slate-700 transition-all shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C79A3C] ${runningAutomation ? "animate-spin" : ""}`} />
            {runningAutomation ? "Menjalankan..." : "Jalankan Automasi Sekarang"}
          </button>
        </div>

        {automationResult && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            {automationResult}
          </div>
        )}

        <p className="text-xs text-slate-500 font-medium">
          Alert dihasilkan otomatis oleh sistem berdasarkan data monitoring peserta (inaktivitas, respons coach).
        </p>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {loadingAlerts ? (
            <p className="text-xs text-slate-500">Memuat monitoring alerts...</p>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Tidak ada monitoring alert saat ini.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  alert.status === "RESOLVED"
                    ? "border-slate-200 bg-slate-50 opacity-60"
                    : alert.alert_type === "INACTIVITY"
                    ? "border-amber-200 bg-amber-50"
                    : "border-rose-200 bg-rose-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      alert.alert_type === "INACTIVITY" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {alert.alert_type === "INACTIVITY" ? "INAKTIVITAS" : "RESPONS COACH"}
                    </span>
                    {alert.status === "RESOLVED" && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        RESOLVED
                      </span>
                    )}
                  </div>
                  {alert.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
                <p className="text-slate-700 font-medium">{alert.message}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(alert.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
