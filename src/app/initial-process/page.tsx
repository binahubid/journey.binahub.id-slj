"use client";

import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { Card } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";

export default function InitialProcessPage() {
  return (
    <ParticipantLayout activePath="/initial-process" pageTitle="Initial Process">
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-warm-border space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-navy-900">Initial Process</h1>
            <p className="text-xs text-slate-500 font-medium">
              Halaman ini disiapkan untuk tahap awal proses pendampingan SLJ.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>Tahap Persiapan (Segera Hadir)</span>
          </div>
        </Card>
      </div>
    </ParticipantLayout>
  );
}
