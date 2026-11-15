"use client";

import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { Skeleton } from "@/components/ui/skeleton";

const pageTitles = {
  dashboard: "Beranda",
  trial: "Beranda",
  journey: "Rencana perubahan",
  monitoring: "Progres dan evaluasi",
  journal: "Jurnal refleksi",
  profile: "Profil",
};

type PageKind = keyof typeof pageTitles;

function HomePlaceholder() {
  return (
    <>
      <Skeleton className="h-[400px] rounded-3xl sm:h-[440px] lg:h-auto lg:min-h-[440px] lg:aspect-video" />
      <div className="grid grid-cols-3 gap-4 rounded-3xl bg-white p-5 lg:hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-3">
            <Skeleton className="size-14 rounded-2xl" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="hidden h-48 rounded-3xl lg:block" />
        <Skeleton className="hidden h-48 rounded-3xl lg:block" />
      </div>
    </>
  );
}

function ProgressPlaceholder() {
  return (
    <>
      <div className="space-y-5 rounded-3xl bg-white p-5 sm:p-7">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-10 max-w-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-16 rounded-xl" />
          <Skeleton className="h-11 w-16 rounded-xl" />
          <Skeleton className="h-11 w-16 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-3 rounded-2xl bg-white p-4 sm:p-5">
            <Skeleton className="h-4 w-28 max-w-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <div className="space-y-5 rounded-3xl bg-white p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-44 rounded-2xl sm:h-52" />
      </div>
    </>
  );
}

function JournalPlaceholder() {
  return (
    <>
      <Skeleton className="h-52 rounded-3xl" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-14 rounded-2xl lg:hidden" />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 rounded-3xl bg-white p-5 sm:p-7 lg:col-span-2">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="hidden h-52 rounded-3xl lg:block" />
      </div>
    </>
  );
}

function PlanPlaceholder() {
  return (
    <div className="space-y-5 rounded-3xl bg-white p-5 sm:p-7">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-2 w-full rounded-full" />
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36 max-w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div className="space-y-5 pt-6">
      <div className="flex min-h-80 flex-col justify-center gap-6 rounded-3xl bg-white p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-3xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-28 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-2 rounded-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    </div>
  );
}

const placeholders = {
  dashboard: HomePlaceholder,
  trial: HomePlaceholder,
  journey: PlanPlaceholder,
  monitoring: ProgressPlaceholder,
  journal: JournalPlaceholder,
  profile: ProfilePlaceholder,
};

export function ParticipantPageSkeleton({ kind }: { kind: PageKind }) {
  const Placeholder = placeholders[kind];
  const home = kind === "dashboard" || kind === "trial";
  return (
    <ParticipantLayout
      activePath={"/" + kind}
      pageTitle={pageTitles[kind]}
      hideBackToHome={home || kind === "journey"}
    >
      <div role="status" className="mx-auto max-w-6xl">
        <span className="sr-only">Memuat {pageTitles[kind].toLocaleLowerCase("id-ID")}</span>
        <div aria-hidden="true" className="space-y-6">
          <Placeholder />
        </div>
      </div>
    </ParticipantLayout>
  );
}
