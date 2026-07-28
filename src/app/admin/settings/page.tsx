"use client";

import { useState } from "react";
import { Settings, ShieldCheck, Key, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b border-[#EAE5D9] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-[#C79A3C]" /> System & Security Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Pengaturan global akses kode, kebersihan data, dan opsi integrasi platform.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          Pengaturan berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#EAE5D9] p-6 space-y-6 shadow-2xs">
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-[#071A33] border-b border-[#EAE5D9] pb-3">
            Keamanan Access Code & Sign Up
          </h2>

          <div className="flex items-start justify-between gap-4 py-2">
            <div>
              <h3 className="font-bold text-xs text-[#071A33]">Wajibkan Access Code saat Registrasi Peserta</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peserta tidak dapat mendaftar tanpa kode akses batch resmi dari perusahaan/HR.
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[#0B2C6B]" />
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-t border-[#EAE5D9]">
            <div>
              <h3 className="font-bold text-xs text-[#071A33]">Otomatiskan Penugasan Coach via Access Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saat peserta mendaftar dengan Access Code, coach dan batch langsung terhubung otomatis.
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[#0B2C6B]" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#EAE5D9]">
          <h2 className="text-base font-extrabold text-[#071A33] border-b border-[#EAE5D9] pb-3">
            Company HR Dashboard Privacy Strict Mode
          </h2>

          <div className="flex items-start justify-between gap-4 py-2">
            <div>
              <h3 className="font-bold text-xs text-[#071A33]">Enforce Absolute Journal Privacy</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua refleksi & jurnal pribadi peserta 100% terkunci dari tampilan HR Perusahaan.
              </p>
            </div>
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded accent-emerald-600" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4 text-[#C79A3C]" /> Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
