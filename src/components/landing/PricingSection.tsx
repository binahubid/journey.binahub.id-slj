"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    duration: "1 bulan",
    price: "Rp3 juta",
    name: "Bangun fondasi",
    description: "Mulai perubahan dengan fokus pengembangan yang terarah.",
  },
  {
    duration: "2 bulan",
    price: "Rp5 juta",
    name: "Jaga konsistensi",
    description: "Berikan waktu untuk melatih dan memperkuat kebiasaan baru.",
  },
  {
    duration: "3 bulan",
    price: "Rp7 juta",
    name: "Perkuat perubahan",
    description:
      "Jalani proses perubahan secara lebih menyeluruh dan berkelanjutan.",
  },
];

export function PricingSection({
  trialClosed = false,
  trialHref = "/register",
  trialLabel,
}: {
  trialClosed?: boolean;
  trialHref?: string;
  trialLabel?: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState(2);
  const plan = plans[selectedPlan];

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-navy-50 px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 grid gap-5 lg:mb-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-4 text-sm font-medium text-[#85652D]">
              Pilihan perjalanan
            </p>
            <h2 className="max-w-xl text-balance text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl lg:text-5xl">
              Mulai dengan satu langkah baik.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-sm leading-7 text-slate-600 sm:text-base lg:justify-self-end">
            Kenali BinaJourney melalui uji coba spiritual. Lanjutkan dengan
            pendampingan sesuai kebutuhan dan waktu yang Anda siapkan.
          </p>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          <article className="relative isolate flex flex-col overflow-hidden rounded-2xl bg-navy-900 p-6 text-white sm:p-8 lg:order-2">
            <img
              src="/bg-filosofi.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width="1810"
              height="869"
              className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-50"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#E4C992]">
                Uji coba mandiri
              </p>
              <BookOpen
                aria-hidden="true"
                className="size-5 text-[#E4C992]"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="mt-6 text-xl font-medium">Mulai dari kebiasaan</h3>
            <p className="mt-5 flex items-baseline gap-3">
              <span className="text-6xl font-medium leading-none tabular-nums sm:text-7xl">
                14
              </span>
              <span className="text-lg text-slate-200">hari</span>
            </p>
            <p className="mt-4 text-2xl font-semibold">Gratis</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Ruang untuk merawat ibadah dan mengenali kebiasaan Anda
              sehari-hari.
            </p>
            <ul className="my-6 grid gap-3 text-sm text-slate-100">
              {[
                "Catatan salat & Al-Qur’an",
                "Hadits harian",
                "Jurnal refleksi",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[#E4C992]"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/15 pt-6">
              <Link
                href={trialHref}
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 text-center text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {trialLabel ??
                  (trialClosed ? "Masuk ke akun" : "Mulai uji coba")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-5 text-slate-300">
                {trialClosed
                  ? "Pendaftaran peserta baru sedang ditutup."
                  : "Tanpa pembayaran · Mulai setelah akun diaktifkan"}
              </p>
            </div>
          </article>

          <article className="flex min-w-0 flex-col rounded-2xl border border-navy-100 bg-white p-5 sm:p-8 lg:col-span-2">
            <div className="mb-7 flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-navy-100 bg-navy-50 text-navy-900">
                <Compass
                  aria-hidden="true"
                  className="size-6"
                  strokeWidth={1.5}
                />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-navy-900 sm:text-xl">
                  Pendampingan transformasi
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Tumbuhkan perubahan dengan arah dan pendampingan.
                </p>
              </div>
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-navy-900">
                Pilih durasi pendampingan
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {plans.map((option, index) => (
                  <label
                    key={option.duration}
                    className="relative min-w-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="slj-plan-duration"
                      value={option.duration}
                      checked={selectedPlan === index}
                      onChange={() => setSelectedPlan(index)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-xl border px-2 py-4 text-navy-900 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy-900 sm:px-5 sm:py-5",
                        selectedPlan === index
                          ? "border-[#A47B30] bg-[#FCF8EF]"
                          : "border-slate-200 bg-white hover:border-slate-400 hover:bg-navy-50"
                      )}
                    >
                      <span className="flex items-center justify-between gap-1 whitespace-nowrap text-xs font-medium sm:text-sm">
                        {option.duration}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full border",
                            selectedPlan === index
                              ? "border-navy-900 bg-navy-900 text-white"
                              : "border-slate-300"
                          )}
                        >
                          {selectedPlan === index && (
                            <Check className="size-3" />
                          )}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold tabular-nums min-[375px]:text-base sm:text-2xl">
                        {option.price}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-7 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2 sm:items-start">
              <div>
                <p className="text-lg font-semibold text-navy-900">
                  {plan.name}
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
              </div>
              <div className="sm:text-right">
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-4xl font-semibold leading-none text-navy-900 tabular-nums sm:text-5xl"
                >
                  <span className="sr-only">
                    Estimasi untuk {plan.duration},{" "}
                  </span>
                  {plan.price}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Estimasi per peserta untuk {plan.duration}
                </p>
              </div>
            </div>
            <ul className="my-7 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              {[
                "Pendampingan transformasi",
                "Rencana perubahan pribadi",
                "Pemantauan progres",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-[#85652D]"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xs text-xs leading-5 text-slate-500">
                Cakupan layanan dan jadwal disepakati bersama sebelum bergabung.
              </p>
              <a
                href="#kontak"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-lg bg-navy-900 px-5 text-center text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
              >
                Diskusikan program{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          </article>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-6 text-slate-600">
          Harga pendampingan merupakan estimasi awal. Uji coba berfokus pada
          aktivitas spiritual, dengan pratinjau area pengembangan lainnya.
          Aktivitas tambahan seperti berkuda dibahas terpisah.
        </p>
      </div>
    </section>
  );
}
