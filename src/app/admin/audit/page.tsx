"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/company-store";

interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

const TABLE_LABELS: Record<string, string> = {
  companies: "Perusahaan",
  batches: "Batch",
  profiles: "Profil",
  journeys: "Perjalanan",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-rose-50 text-rose-700",
};

function DiffViewer({ oldData, newData }: { oldData: any; newData: any }) {
  if (!oldData && !newData) return null;

  const oldKeys = oldData ? Object.keys(oldData) : [];
  const newKeys = newData ? Object.keys(newData) : [];
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

  const changes = allKeys
    .filter((key) => {
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    })
    .slice(0, 15);

  if (changes.length === 0) return null;

  return (
    <div className="mt-2 text-[10px] space-y-1">
      {changes.map((key) => (
        <div key={key} className="flex items-start gap-2">
          <span className="font-bold text-slate-600 shrink-0 w-24 truncate">{key}:</span>
          {oldData?.[key] !== undefined && (
            <span className="text-rose-600 line-through truncate">{String(oldData[key]).slice(0, 50)}</span>
          )}
          {newData?.[key] !== undefined && (
            <span className="text-emerald-700 font-semibold truncate">{String(newData[key]).slice(0, 50)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterTable, setFilterTable] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadAuditLog();
  }, [page, filterTable]);

  async function loadAuditLog() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_audit_log", {
        p_table_name: filterTable === "all" ? null : filterTable,
        p_limit: pageSize,
        p_offset: page * pageSize,
      });
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      setErrorMsg(formatSupabaseError(err, "Gagal memuat audit log."));
    } finally {
      setLoading(false);
    }
  }

  const filtered = entries.filter((e) => {
    if (filterAction !== "all" && e.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-[#C79A3C]" /> Audit Log
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Catatan perubahan data perusahaan, batch, profil, dan perjalanan.
          </p>
        </div>
        <button
          onClick={loadAuditLog}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EAE5D9] text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs self-start"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#C79A3C]" /> Refresh
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="p-5 rounded-2xl border border-[#EAE5D9] bg-white space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
          <Filter className="h-4 w-4 text-[#C79A3C]" />
          <span>Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">Tabel</label>
            <select
              value={filterTable}
              onChange={(e) => { setFilterTable(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Tabel</option>
              <option value="companies">Perusahaan</option>
              <option value="batches">Batch</option>
              <option value="profiles">Profil</option>
              <option value="journeys">Perjalanan</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase block">Aksi</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5D9] bg-[#FAF8F4] text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
            >
              <option value="all">Semua Aksi</option>
              <option value="INSERT">Dibuat</option>
              <option value="UPDATE">Diperbarui</option>
              <option value="DELETE">Dihapus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EAE5D9]">
          <h2 className="text-base font-extrabold text-[#071A33]">
            {filtered.length} Entri
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9] text-slate-400 font-bold">
                <th className="p-4 font-semibold">Waktu</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Aksi</th>
                <th className="p-4 font-semibold">Tabel</th>
                <th className="p-4 font-semibold">Record ID</th>
                <th className="p-4 font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5D9]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Memuat audit log...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    {errorMsg || "Tidak ada entri audit."}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <>
                      <tr
                        key={entry.id}
                        className="hover:bg-[#FAF8F4]/80 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-medium text-slate-600">
                          {entry.actor_email || "System"}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-600"}`}>
                            {ACTION_LABELS[entry.action] || entry.action}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#071A33]">
                          {TABLE_LABELS[entry.table_name] || entry.table_name}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500 max-w-[120px] truncate">
                          {entry.record_id}
                        </td>
                        <td className="p-4">
                          {(entry.old_data || entry.new_data) && (
                            isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${entry.id}-detail`}>
                          <td colSpan={6} className="px-4 pb-4">
                            <div className="bg-[#FAF8F4] rounded-xl p-3 border border-[#EAE5D9]">
                              <p className="text-[10px] font-bold text-slate-500 mb-1">Perubahan Data:</p>
                              <DiffViewer oldData={entry.old_data} newData={entry.new_data} />
                              {!entry.old_data && entry.new_data && (
                                <div className="text-[10px] text-slate-600 mt-1">
                                  <span className="font-bold">Data baru:</span>{" "}
                                  {JSON.stringify(entry.new_data).slice(0, 200)}...
                                </div>
                              )}
                              {entry.old_data && !entry.new_data && (
                                <div className="text-[10px] text-rose-600 mt-1">
                                  <span className="font-bold">Data dihapus:</span>{" "}
                                  {JSON.stringify(entry.old_data).slice(0, 200)}...
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length >= pageSize && (
          <div className="flex items-center justify-between p-4 border-t border-[#EAE5D9]">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-xs font-medium text-slate-500">Halaman {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={filtered.length < pageSize}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
