"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Key,
  Copy,
  Check,
  Building2,
  UserCheck,
  Search,
  X,
  Share2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CalendarClock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getStoredCompanies,
  getStoredBatches,
  saveBatches,
  fetchCompaniesFromSupabase,
  fetchBatchesFromSupabase,
  createBatchInSupabase,
  INITIAL_COACHES,
  Batch,
  Company,
} from "@/lib/company-store";

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Mass Lock Batch state
  const [selectedLockBatch, setSelectedLockBatch] = useState<Batch | null>(null);
  const [lockingBatch, setLockingBatch] = useState(false);
  const [lockSuccessMsg, setLockSuccessMsg] = useState<string | null>(null);

  // Auto-lock modal state
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);
  const [autoLockBatch, setAutoLockBatch] = useState<Batch | null>(null);
  const [autoLockAt, setAutoLockAt] = useState("");
  const [savingAutoLock, setSavingAutoLock] = useState(false);

  // Form states
  const [batchName, setBatchName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [coachId, setCoachId] = useState(INITIAL_COACHES[0]?.id || "coach-1");
  const [startDate, setStartDate] = useState("2027-02-01");
  const [endDate, setEndDate] = useState("2027-05-01");
  const [generatedCode, setGeneratedCode] = useState("");
  const [formAutoLockAt, setFormAutoLockAt] = useState("");

  const handleExecuteMassLock = async () => {
    if (!selectedLockBatch) return;
    setLockingBatch(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Find profiles in this batch
      const { data: profilesInBatch } = await supabase
        .from("profiles")
        .select("user_id")
        .or(`program_code.eq.${selectedLockBatch.accessCode},batch_id.eq.${selectedLockBatch.id}`);

      const userIds = (profilesInBatch || []).map((p) => p.user_id);

      if (userIds.length > 0) {
        // Bulk update journeys status
        await supabase
          .from("journeys")
          .update({
            ptp_status: "LOCKED",
            locked_at: new Date().toISOString(),
            locked_by: user?.id || null,
          })
          .in("user_id", userIds);
      } else {
        // Fallback: lock all editable journeys
        await supabase
          .from("journeys")
          .update({
            ptp_status: "LOCKED",
            locked_at: new Date().toISOString(),
            locked_by: user?.id || null,
          })
          .eq("ptp_status", "EDITABLE");
      }

      setLockSuccessMsg(`Seluruh Dokumen PTP pada Batch "${selectedLockBatch.name}" berhasil dikunci!`);
      setTimeout(() => setLockSuccessMsg(null), 4000);
      setSelectedLockBatch(null);
    } catch (err) {
      console.error("Gagal melakukan Lock PTP:", err);
    } finally {
      setLockingBatch(false);
    }
  };

  const handleSaveAutoLock = async () => {
    if (!autoLockBatch || !autoLockAt) return;
    setSavingAutoLock(true);
    try {
      const supabase = createClient();
      await supabase
        .from("batches")
        .update({ auto_lock_at: new Date(autoLockAt).toISOString() })
        .eq("id", autoLockBatch.id);
      setLockSuccessMsg(`Auto-Lock PTP batch "${autoLockBatch.name}" dijadwalkan pada ${new Date(autoLockAt).toLocaleString("id-ID")}`);
      setTimeout(() => setLockSuccessMsg(null), 5000);
      setShowAutoLockModal(false);
      setAutoLockBatch(null);
      setAutoLockAt("");
    } catch (err) {
      console.error("Gagal menyimpan auto-lock:", err);
    } finally {
      setSavingAutoLock(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const compList = await fetchCompaniesFromSupabase();
      const batchList = await fetchBatchesFromSupabase();
      setCompanies(compList);
      setBatches(batchList);

      if (compList.length > 0) {
        setCompanyId(compList[0].id);
        generateCodeForCompany(compList[0]);
      }
    }
    loadData();
  }, []);

  const generateCodeForCompany = (comp: Company) => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setGeneratedCode(`${comp.code}-2027-${randomNum}`);
  };

  const handleCompanyChange = (cId: string) => {
    setCompanyId(cId);
    const comp = companies.find((c) => c.id === cId);
    if (comp) generateCodeForCompany(comp);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !companyId) return;

    const comp = companies.find((c) => c.id === companyId);
    const coach = INITIAL_COACHES.find((c) => c.id === coachId);
    const codeToUse = generatedCode || `${comp?.code || "BATCH"}-2027-${Date.now().toString().slice(-3)}`;

    const created = await createBatchInSupabase({
      companyId,
      companyName: comp?.name || "Corporate Mitra",
      name: batchName,
      accessCode: codeToUse,
      status: "Active",
      startDate,
      endDate,
      coachName: coach?.name || "Coach Pendamping",
    });

    const newBatch: Batch = created || {
      id: `batch-${Date.now()}`,
      companyId,
      companyName: comp?.name || "Corporate Mitra",
      name: batchName,
      accessCode: codeToUse,
      status: "Active",
      startDate,
      endDate,
      participantCount: 0,
      coachId: coach?.id || "coach-1",
      coachName: coach?.name || "Coach Pendamping",
      healthScore: 100,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newBatch, ...batches];
    setBatches(updated);
    saveBatches(updated);

    setBatchName("");
    setShowAddModal(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.accessCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompanyFilter === "all" || b.companyId === selectedCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
            Batches & Access Codes
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Generate kode akses unik per batch untuk dibagikan ke HR / peserta corporate.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md"
        >
          <Plus className="h-4 w-4 text-[#C79A3C]" /> Buat Batch & Kode Akses
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama batch, kode akses, atau perusahaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          />
        </div>

        {/* Company Dropdown Filter */}
        <select
          value={selectedCompanyFilter}
          onChange={(e) => setSelectedCompanyFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
        >
          <option value="all">Semua Perusahaan ({companies.length})</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Batches Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9] text-slate-400 font-bold">
                <th className="p-4 font-semibold">Perusahaan (Company)</th>
                <th className="p-4 font-semibold">Nama Batch</th>
                <th className="p-4 font-semibold">Access Code</th>
                <th className="p-4 font-semibold">Associate</th>
                <th className="p-4 font-semibold">Peserta</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Auto-Lock PTP</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAF8F4]/80 transition-colors">
                  <td className="p-4 font-bold text-[#071A33]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#C79A3C]" />
                      <span>{b.companyName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-extrabold text-[#0B2C6B]">{b.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 font-mono font-extrabold text-[#071A33] bg-[#FAF8F4] px-3 py-1 rounded-lg border border-[#EAE5D9]">
                      <Key className="h-3.5 w-3.5 text-[#C79A3C]" />
                      {b.accessCode}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>{b.coachName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-[#071A33]">{b.participantCount} Peserta</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.status === "Upcoming"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => { setAutoLockBatch(b); setShowAutoLockModal(true); }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition-all"
                      title="Atur jadwal auto-lock PTP"
                    >
                      <CalendarClock className="h-3 w-3 text-purple-600" />
                      <span>Atur Jadwal</span>
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleCopyCode(b.accessCode)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0B2C6B]/20 bg-white hover:bg-[#FAF8F4] text-[#071A33] text-[11px] font-bold transition-all"
                    >
                      {copiedCode === b.accessCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#C79A3C]" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedLockBatch(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all"
                      title="Kunci seluruh PTP peserta pada batch ini sekarang"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Lock PTP</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Batch & Generate Access Code */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#071A33]">Buat Batch & Generate Access Code</h3>
              <p className="text-xs text-slate-500 font-medium">
                Pilih perusahaan entitas untuk membuat rombongan (batch) dan kode akses unik.
              </p>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Perusahaan (Company)</label>
                <select
                  value={companyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Nama Batch Rombongan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Umrah Mei 2027 Executive"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Generated Access Code (Otomatis)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedCode}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#C79A3C]/50 bg-[#FAF8F4] font-mono font-extrabold text-xs text-[#0B2C6B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const comp = companies.find((c) => c.id === companyId);
                      if (comp) generateCodeForCompany(comp);
                    }}
                    className="px-3 py-2.5 rounded-lg border border-[#EAE5D9] text-xs font-bold text-slate-600 hover:bg-slate-50 shrink-0"
                  >
                    Acak Ulang
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Alokasi Associate</label>
                <select
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                >
                  {INITIAL_COACHES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.participantCount} peserta bimbingan)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">
                  <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-purple-600" /> Auto-Lock PTP (opsional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={formAutoLockAt}
                  onChange={(e) => setFormAutoLockAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">Jika diisi, PTP peserta akan otomatis terkunci pada waktu yang ditentukan.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5"
                >
                  <Share2 className="h-4 w-4 text-[#C79A3C]" /> Buat Batch & Bagikan Kode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Lock Confirmation Modal */}
      {selectedLockBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedLockBatch(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 text-amber-900">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#071A33]">Lock PTP</h3>
                <p className="text-xs text-amber-800 font-medium">Batch: {selectedLockBatch.name}</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl space-y-2 text-xs text-amber-950 leading-relaxed">
              <p className="font-semibold">
                🔒 Apakah Anda yakin ingin mengunci seluruh dokumen PTP peserta pada batch ini?
              </p>
              <p className="text-[11px] text-amber-900/80">
                Setelah dikunci, peserta pada batch ini tidak lagi dapat mengubah Target Utama, Area Transformasi, dan Action Plan mereka.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLockBatch(null)}
                disabled={lockingBatch}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteMassLock}
                disabled={lockingBatch}
                className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5"
              >
                {lockingBatch ? "Mengunci..." : "Ya, Lock PTP Batch Ini"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Lock Schedule Modal */}
      {showAutoLockModal && autoLockBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-purple-200 p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => { setShowAutoLockModal(false); setAutoLockBatch(null); }} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <CalendarClock className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#071A33]">Atur Auto-Lock PTP</h3>
                <p className="text-xs text-purple-800 font-medium">Batch: {autoLockBatch.name}</p>
              </div>
            </div>

            <div className="bg-purple-50/80 border border-purple-200/80 p-3.5 rounded-xl space-y-2 text-xs text-purple-950 leading-relaxed">
              <p className="font-semibold">📅 Tentukan tanggal & jam PTP akan otomatis terkunci</p>
              <p className="text-[11px] text-purple-900/80">Setelah waktu yang ditentukan, peserta tidak dapat mengubah dokumen PTP mereka.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#071A33] mb-2">Tanggal & Jam Auto-Lock</label>
              <input
                type="datetime-local"
                value={autoLockAt}
                onChange={(e) => setAutoLockAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-purple-300 text-xs text-[#071A33] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button type="button" onClick={() => { setShowAutoLockModal(false); setAutoLockBatch(null); }} disabled={savingAutoLock} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100">
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAutoLock}
                disabled={savingAutoLock || !autoLockAt}
                className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Clock className="h-3.5 w-3.5" />
                {savingAutoLock ? "Menyimpan..." : "Simpan Jadwal Auto-Lock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {lockSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{lockSuccessMsg}</span>
        </div>
      )}
    </div>
  );
}
