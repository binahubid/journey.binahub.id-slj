"use client";

import { useState } from "react";
import { BarChart3, Download, FlaskConical, Radio } from "lucide-react";
import { DemoImpactReport } from "@/components/admin/DemoImpactReport";
import { LiveImpactReport } from "@/components/admin/LiveImpactReport";

export default function AdminImpactReportPage() {
  const [reportMode, setReportMode] = useState<"demo" | "live">("demo");

  return (
    <div className="space-y-6 w-full pb-16 text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#0F1E3D]"><BarChart3 className="h-6 w-6 text-[#C79A3C]" />BinaJourney Transformation Impact Report</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">Gunakan Demo Report untuk presentasi dan Live Report untuk data operasional aktual.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button onClick={() => setReportMode("demo")} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold ${reportMode === "demo" ? "bg-[#0F1E3D] text-amber-400 shadow-sm" : "text-slate-600"}`}><FlaskConical className="h-3.5 w-3.5" />Demo Report</button>
            <button onClick={() => setReportMode("live")} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold ${reportMode === "live" ? "bg-[#0F1E3D] text-emerald-300 shadow-sm" : "text-slate-600"}`}><Radio className="h-3.5 w-3.5" />Live Report</button>
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#C79A3C] px-4 py-2.5 text-xs font-extrabold text-[#0F1E3D] shadow-md"><Download className="h-4 w-4" />Export PDF</button>
        </div>
      </div>

      {reportMode === "demo" ? <DemoImpactReport /> : <LiveImpactReport />}
    </div>
  );
}
