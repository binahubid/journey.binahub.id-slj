"use client";

import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function CompanyNotFound() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#071A33]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Company
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <div className="h-20 w-20 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-200">
          <Building2 className="h-10 w-10 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-[#071A33]">
            Perusahaan Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-sm">
            ID perusahaan yang Anda cari tidak valid atau sudah dihapus.
            Periksa kembali tautan yang Anda gunakan.
          </p>
        </div>
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs font-bold transition-all shadow-md"
        >
          Lihat Semua Perusahaan
        </Link>
      </div>
    </div>
  );
}
