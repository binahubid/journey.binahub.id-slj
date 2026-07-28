"use client";

import { useEffect, useState } from "react";
import { Bell, Send, CheckCircle2, Building2, Layers, UserCheck, Users, ShieldAlert } from "lucide-react";
import {
  getStoredCompanies,
  getStoredBatches,
  INITIAL_COACHES,
  INITIAL_PARTICIPANTS,
  INITIAL_NOTIFICATIONS,
  BroadcastNotification,
  Company,
  Batch,
  AdminCoach,
  AdminParticipant,
} from "@/lib/company-store";

export default function AdminNotificationsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [sentList, setSentList] = useState<BroadcastNotification[]>(INITIAL_NOTIFICATIONS);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"all" | "company" | "batch" | "coach" | "participant">("all");
  const [targetId, setTargetId] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    setCompanies(getStoredCompanies());
    setBatches(getStoredBatches());
    setCoaches(INITIAL_COACHES);
    setParticipants(INITIAL_PARTICIPANTS);
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    let targetLabel = "Semua Perusahaan & Peserta";
    let recipientCount = 487;

    if (scope === "company") {
      const comp = companies.find((c) => c.id === targetId) || companies[0];
      targetLabel = `Perusahaan: ${comp.name}`;
      recipientCount = comp.participantCount;
    } else if (scope === "batch") {
      const b = batches.find((item) => item.id === targetId) || batches[0];
      targetLabel = `Batch: ${b.companyName} — ${b.name}`;
      recipientCount = b.participantCount;
    } else if (scope === "coach") {
      const c = coaches.find((item) => item.id === targetId) || coaches[0];
      targetLabel = `Kelompok Bimbingan: ${c.name}`;
      recipientCount = c.participantCount;
    } else if (scope === "participant") {
      const p = participants.find((item) => item.id === targetId) || participants[0];
      targetLabel = `Peserta Spesifik: ${p.name}`;
      recipientCount = 1;
    }

    const newNotif: BroadcastNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      targetScope: scope,
      targetId,
      targetLabel,
      sentAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      sentBy: "Super Admin",
      recipientCount,
    };

    setSentList([newNotif, ...sentList]);
    setTitle("");
    setMessage("");
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

          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Target Scope Selection (As requested) */}
            <div>
              <label className="block text-xs font-bold text-[#071A33] mb-1.5">Target Audiens (Scope Broadcast)</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as any);
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
              className="w-full py-3 rounded-xl bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4 text-[#C79A3C]" /> Kirim Broadcast Notifikasi
            </button>
          </form>
        </div>

        {/* Right Column: Broadcast History */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-5 shadow-2xs">
          <h2 className="text-base font-extrabold text-[#071A33] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#C79A3C]" /> Riwayat Broadcast Terkirim
          </h2>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
    </div>
  );
}
