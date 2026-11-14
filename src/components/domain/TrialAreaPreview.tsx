"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Compass, Users, Briefcase, LockKeyhole } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

const areas = [
  {
    name: "Pengembangan diri",
    icon: Heart,
    description:
      "Kenali pola diri, bangun kebiasaan, dan tentukan prioritas yang ingin Anda perbaiki.",
  },
  {
    name: "Kepemimpinan",
    icon: Compass,
    description:
      "Kembangkan cara memimpin yang bertanggung jawab dan selaras dengan nilai Anda.",
  },
  {
    name: "Relasi",
    icon: Users,
    description:
      "Latih komunikasi dan bangun hubungan yang lebih sehat di rumah maupun di tempat kerja.",
  },
  {
    name: "Kontribusi",
    icon: Briefcase,
    description:
      "Wujudkan perubahan yang bermanfaat bagi lingkungan dan komunitas Anda.",
  },
];

export function TrialAreaPreview() {
  const [preview, setPreview] = useState<(typeof areas)[number] | null>(null);
  return (
    <>
            <section
              aria-labelledby="areas-title"
              className="border-t border-slate-200 pt-7"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    id="areas-title"
                    className="text-xl font-semibold tracking-tight"
                  >
                    Perjalanan Anda bisa berlanjut.
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Kenali area lain dalam program pendampingan.
                  </p>
                </div>
                <Link
                  href="/#pricing"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                >
                  Pilihan program <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
                {areas.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => setPreview(area)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <area.icon className="h-5 w-5 text-slate-600" />
                      <LockKeyhole
                        className="h-3.5 w-3.5 text-slate-400"
                        aria-hidden
                      />
                    </div>
                    <span className="block text-sm font-medium">
                      {area.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-600">
                      Pratinjau program
                    </span>
                  </button>
                ))}
              </div>
            </section>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.description}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-7 text-slate-600">
            Area ini tersedia dalam program pendampingan. Selama uji coba, Anda
            dapat mencoba persiapan, refleksi awal, rencana kebiasaan, serta evaluasi pada area Spiritual Growth.
          </p>
          <Link
            href="/#pricing"
            className={buttonVariants({
              className: "mt-5 w-full gap-2 rounded-xl",
            })}
          >
            Lihat pilihan program <ArrowRight className="h-4 w-4" />
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
