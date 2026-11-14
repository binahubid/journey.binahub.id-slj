"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  {
    name: "Muhasabah",
    when: "Sebelum keberangkatan",
    title: "Mulai dengan mengenali diri.",
    description:
      "Luangkan waktu untuk melihat kondisi diri secara jujur. Kenali kebiasaan, kekuatan, dan hal yang ingin Anda perbaiki sebagai titik awal perubahan.",
    activities: [
      "Baseline Self Discovery",
      "Refleksi diri",
      "Membangun ukhuwah",
    ],
    icon: "/icons/stage_01_muhasabah.png",
  },
  {
    name: "Niyyah",
    when: "Menjelang keberangkatan",
    title: "Luruskan niat. Tentukan arah.",
    description:
      "Temukan tujuan yang ingin Anda jaga karena Allah. Susun Personal Transformation Project (PTP), rencana perubahan pribadi yang bisa dijalankan dalam kehidupan sehari-hari.",
    activities: [
      "Meluruskan tujuan",
      "Memaknai amanah kehidupan",
      "Menyusun rencana perubahan",
    ],
    icon: "/icons/stage_02_niyyah.png",
  },
  {
    name: "Mujahadah",
    when: "Di Madinah & Makkah",
    title: "Hidupkan makna dalam ibadah.",
    description:
      "Jalani Umrah sebagai ruang untuk mendekat kepada Allah dan memperjuangkan perubahan diri. Hubungkan pengalaman ibadah dengan pembelajaran yang berarti untuk kehidupan Anda.",
    activities: [
      "Pengalaman Umrah yang bermakna",
      "Refleksi perjalanan",
      "Pendampingan coaching",
    ],
    icon: "/icons/stage_03_mujahadah.png",
  },
  {
    name: "Istiqamah",
    when: "Setelah pulang ke rumah",
    title: "Bawa perubahan ke keseharian.",
    description:
      "Jalankan komitmen yang telah Anda susun. Rawat kebiasaan baik, tinjau perkembangannya, dan diskusikan hambatan bersama pendamping agar langkah Anda terus terjaga.",
    activities: [
      "Membangun kebiasaan",
      "Menjalankan rencana perubahan",
      "Evaluasi bersama coach",
    ],
    icon: "/icons/stage_04_istiqamah.png",
  },
];

export function JourneyStages() {
  const [selectedStage, setSelectedStage] = useState(0);
  const stage = stages[selectedStage];

  return (
    <section
      id="tahapan"
      className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:mb-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 text-sm font-medium text-[#85652D]">
              Empat tahap perjalanan
            </p>
            <h2 className="max-w-xl text-balance text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl lg:text-5xl">
              Dari mengenali diri,
              <br className="hidden sm:block" /> hingga menjaga perubahan.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-sm leading-7 text-slate-600 sm:text-base lg:justify-self-end">
            Setiap tahap memiliki fokus yang saling melengkapi. Pilih tahap
            untuk melihat apa yang akan Anda jalani.
          </p>
        </div>
        <div
          role="group"
          aria-label="Pilih tahap perjalanan"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0"
        >
          {stages.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={selectedStage === index}
              aria-controls="slj-stage-detail"
              onClick={() => setSelectedStage(index)}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-lg border px-4 py-4 text-left text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:px-5 sm:text-base",
                selectedStage === index
                  ? "border-[#A47B30] bg-[#FCF8EF] text-navy-900"
                  : "border-slate-200 text-slate-500 hover:bg-navy-50 hover:text-navy-900"
              )}
            >
              <span
                className={cn(
                  "text-xs tabular-nums",
                  selectedStage === index ? "text-[#85652D]" : "text-slate-500"
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.name}
            </button>
          ))}
        </div>
        <div
          id="slj-stage-detail"
          className="mt-5 overflow-hidden rounded-2xl bg-warm-bg sm:mt-6"
        >
          <div className="grid lg:grid-cols-5">
            <div className="relative flex min-h-48 flex-col items-center justify-center gap-2 overflow-hidden bg-[#F1EEE6] p-6 sm:min-h-60 lg:col-span-2 lg:py-12">
              <img
                key={stage.icon}
                src={stage.icon}
                alt=""
                width="230"
                height="228"
                loading="lazy"
                className="relative h-24 w-auto object-contain sm:h-36"
              />
              <p className="relative mt-2 text-sm font-medium text-[#85652D]">
                {stage.when}
              </p>
            </div>
            <div
              className="p-6 sm:p-8 lg:col-span-3 lg:p-10"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="mb-3 text-sm font-medium text-[#85652D]">
                {stage.name}
              </p>
              <h3 className="text-balance text-2xl font-semibold leading-snug text-navy-900 sm:text-3xl">
                {stage.title}
              </h3>
              <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-slate-600 sm:text-base">
                {stage.description}
              </p>
              <ul className="mt-6 grid gap-3 border-t border-navy-900/10 pt-5 text-sm text-navy-900">
                {stage.activities.map((activity) => (
                  <li key={activity} className="flex items-start gap-3">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[#85652D]"
                    />
                    {activity}
                  </li>
                ))}
              </ul>
              <a
                href="#ekosistem"
                className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-navy-900 underline decoration-navy-900/25 underline-offset-4 hover:decoration-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
              >
                Kenali pendampingannya{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
