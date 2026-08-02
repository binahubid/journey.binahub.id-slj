"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  Users,
  Layers,
  UserCheck,
  Activity,
  X,
  Search,
} from "lucide-react";
import {
  fetchCompaniesFromSupabase,
  createCompanyInSupabase,
  parseSupabaseError,
  Company,
} from "@/lib/company-store";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New Company form
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchCompaniesFromSupabase();
        setCompanies(data);
      } catch {
        setErrorMsg("Data perusahaan belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const created = await createCompanyInSupabase({
        name,
        code: code.toUpperCase(),
        status: "Active",
      });

      const updated = [created, ...companies];
      setCompanies(updated);
      setName("");
      setCode("");
    } catch (err) {
      const parsed = parseSupabaseError(err);
      if (parsed.kind === "duplicate") {
        setErrorMsg(`Kode "${code.toUpperCase()}" sudah digunakan. Gunakan kode berbeda.`);
      } else if (parsed.kind === "permission") {
        setErrorMsg("Anda tidak memiliki izin untuk membuat perusahaan baru.");
      } else if (parsed.kind === "network") {
        setErrorMsg("Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.");
      } else {
        setErrorMsg(parsed.message || "Perusahaan belum tersimpan. Coba lagi.");
      }
    }

    setSaving(false);
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
            Companies (Perusahaan Entitas)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Kelola entitas perusahaan peserta corporate, statistik batch, dan kesehatan program.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md"
        >
          <Plus className="h-4 w-4 text-[#C79A3C]" /> Tambah Company
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari perusahaan atau kode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5D9] bg-white text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
        />
      </div>

      {/* Companies Grid */}
      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p className="text-xs font-semibold text-slate-500">Memuat data perusahaan...</p>}
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-2xl border border-[#EAE5D9] bg-white shadow-2xs hover:border-[#C79A3C] transition-all flex flex-col justify-between space-y-6"
          >
            {/* Company Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#0B2C6B]/10 flex items-center justify-center text-[#0B2C6B]">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase">
                  {c.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#071A33] pt-1">{c.name}</h2>
              <p className="text-xs font-mono font-bold text-[#C79A3C]">KODE: {c.code}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#FAF8F4] text-center border border-[#EAE5D9]/60">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Peserta</span>
                <span className="text-base font-extrabold text-[#071A33]">{c.participantCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Batch</span>
                <span className="text-base font-extrabold text-[#071A33]">{c.batchCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Coach</span>
                <span className="text-base font-extrabold text-[#071A33]">{c.coachCount}</span>
              </div>
            </div>

            {/* Health & CTA */}
            <div className="pt-2 flex items-center justify-between border-t border-[#EAE5D9]/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Score: <strong className="text-emerald-700">{c.healthScore}</strong></span>
              </div>
              <Link href={`/admin/companies/${c.id}`}>
                <button className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2C6B] hover:text-[#071A33]">
                  Detail <ArrowRight className="h-3.5 w-3.5 text-[#C79A3C]" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Company */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#071A33]">Tambah Company Baru</h3>
              <p className="text-xs text-slate-500 font-medium">
                Buat entitas perusahaan mitra untuk pembagian batch & kode akses.
              </p>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: PT Pertamina"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#071A33] mb-1">Kode Singkatan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: PERTAMINA"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#EAE5D9] text-xs text-[#071A33] uppercase focus:outline-none focus:border-[#C79A3C]"
                />
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
                   disabled={saving}
                   className="px-5 py-2 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold shadow-md"
                >
                   {saving ? "Menyimpan..." : "Simpan Perusahaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
