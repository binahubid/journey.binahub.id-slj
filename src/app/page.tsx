"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MotivationDeclineChart } from "@/components/domain/MotivationDeclineChart";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { JourneyStages } from "@/components/landing/JourneyStages";
import { PricingSection } from "@/components/landing/PricingSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  audiences,
  benefits,
  challenges,
  comparisons,
  faqs,
  resources,
} from "@/components/landing/landing-content";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trialClosed, setTrialClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const supabase = createClient();
      void supabase.auth
        .getUser()
        .then(({ data }) => {
          if (!cancelled && data?.user) setIsLoggedIn(true);
        })
        .catch(() => {});
      void Promise.resolve(supabase.rpc("slj_trial_offer"))
        .then(({ data, error }) => {
          if (!cancelled && !error && typeof data?.enabled === "boolean")
            setTrialClosed(!data.enabled);
        })
        .catch(() => {});
    } catch {
      // Public program information remains available if the client cannot initialise.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const startHref = isLoggedIn
    ? "/dashboard"
    : trialClosed
    ? "/login"
    : "/register";
  const startLabel = isLoggedIn
    ? "Buka perjalanan"
    : trialClosed
    ? "Masuk"
    : "Coba 14 hari gratis";

  return (
    <div className="min-h-screen bg-warm-bg font-sans text-navy-900 selection:bg-accent/20">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-navy-900 px-5 py-3 text-sm text-white focus:not-sr-only"
      >
        Lewati ke konten utama
      </a>
      <LandingHeader startHref={startHref} startLabel={startLabel} />
      <main id="main-content" tabIndex={-1}>
        <section
          id="tentang"
          className="scroll-mt-24 px-5 pb-8 pt-8 sm:px-8 sm:pb-12 sm:pt-12 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="py-2 sm:py-6 lg:py-10">
              <p className="mb-5 text-sm font-medium text-[#85652D]">
                Spiritual Leadership Journey
              </p>
              <h1 className="max-w-xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl lg:leading-tight">
                Jaga kebaikan,
                <br />
                sepulang Umrah.
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
                Program pendampingan transformasi 90 hari untuk membawa makna
                Umrah ke kehidupan pribadi, keluarga, pekerjaan, dan
                kepemimpinan Anda.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-5">
                <Link
                  href={startHref}
                  className="inline-flex min-h-12 items-center justify-center gap-4 rounded-lg bg-navy-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
                >
                  {startLabel}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-[#E4C992]"
                  />
                </Link>
                <a
                  href="#tahapan"
                  className="inline-flex min-h-11 items-center justify-center gap-3 text-sm font-medium text-navy-900 underline decoration-navy-900/25 underline-offset-4 hover:decoration-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
                >
                  Kenali perjalanannya
                  <ArrowDown aria-hidden="true" className="size-4" />
                </a>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-600">
                {trialClosed
                  ? "Pendaftaran peserta baru sedang ditutup. Peserta terdaftar dapat masuk ke akun."
                  : "Uji coba spiritual 14 hari · Gratis, mulai setelah aktivasi akun"}
              </p>
            </div>
            <figure className="relative isolate overflow-hidden rounded-t-[12rem] rounded-b-2xl bg-[#EEE4D3] sm:rounded-t-[16rem]">
              <img
                src="/hero.webp"
                alt="Seorang jamaah menghadap Ka’bah dalam suasana hangat menjelang senja"
                width="1672"
                height="941"
                fetchPriority="high"
                loading="eager"
                className="aspect-[6/5] w-full object-cover object-[55%_center] sm:aspect-[5/4] lg:aspect-[5/6]"
              />
              <figcaption className="border-t border-navy-900/10 bg-white px-5 py-4 text-center text-xs font-medium text-[#85652D] sm:text-sm">
                Leadership Beyond the Limit
              </figcaption>
            </figure>
          </div>
          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-3 gap-3 border-t border-navy-900/15 pt-6 text-xs leading-5 text-slate-600 sm:mt-10 sm:gap-6 sm:text-sm">
            {[
              "Menata niat sebelum berangkat",
              "Menemukan makna di Tanah Suci",
              "Menjaga langkah setelah pulang",
            ].map((label, index) => (
              <p key={label} className="flex items-start gap-2 sm:gap-3">
                <span className="text-[#85652D] tabular-nums">
                  0{index + 1}
                </span>
                {label}
              </p>
            ))}
          </div>
        </section>

        <section
          id="why-slj"
          className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="mb-4 text-sm font-medium text-[#85652D]">
                Mengapa SLJ?
              </p>
              <h2 className="max-w-lg text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Perjalanan pulang juga perlu arah.
              </h2>
              <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-slate-600 sm:text-base">
                Umrah memberi ruang untuk berhenti dan menata hati. Saat
                kembali, niat baik itu bertemu dengan rutinitas sehari-hari. SLJ
                membantu Anda merawatnya menjadi langkah yang nyata.
              </p>
            </div>
            <div id="masalah" className="scroll-mt-24 lg:col-span-3">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-8">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.title}
                    className="border-t border-navy-900/15 pt-5"
                  >
                    <h3 className="text-base font-semibold">
                      {challenge.title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-7 text-slate-600">
                      {challenge.description}
                    </p>
                  </div>
                ))}
              </div>
              <details className="group mt-6 border-t border-navy-900/15 pt-2">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 [&::-webkit-details-marker]:hidden">
                  Lihat ilustrasi tantangan menjaga semangat
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="pt-4">
                  <MotivationDeclineChart />
                </div>
              </details>
            </div>
          </div>
        </section>

        <JourneyStages />

        <section
          id="ekosistem"
          className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-sm font-medium text-[#85652D]">
                Ekosistem pendampingan
              </p>
              <h2 className="max-w-lg text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Ada arah.
                <br />
                Ada yang mendampingi.
              </h2>
              <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-slate-600 sm:text-base">
                Tujuh komponen yang saling mendukung, dari memahami diri hingga
                menjaga komitmen dalam keseharian.
              </p>
              <figure className="mt-8 overflow-hidden rounded-2xl bg-[#EEE4D3]">
                <img
                  src="/masjid_pilgrims.webp"
                  alt="Jamaah menjalani ibadah di Masjidil Haram"
                  loading="lazy"
                  width="1024"
                  height="1024"
                  className="aspect-[16/9] w-full object-cover object-[center_40%] sm:aspect-[4/3]"
                />
                <figcaption className="bg-navy-900 px-5 py-4 text-sm leading-6 text-slate-200">
                  Bersama coach, Sahabat Safar, dan platform digital.
                </figcaption>
              </figure>
            </div>
            <div className="border-t border-navy-900/15">
              {resources.map((resource, index) => (
                <details
                  key={resource.name}
                  name="slj-resources"
                  open={index === 0}
                  className="group border-b border-navy-900/15"
                >
                  <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium leading-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 sm:text-lg [&::-webkit-details-marker]:hidden">
                    {resource.name}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[#85652D] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="max-w-lg pb-6 pr-6 text-pretty text-sm leading-7 text-slate-600">
                    {resource.description}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="manfaat"
          className="scroll-mt-24 border-y border-navy-900/10 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-sm font-medium text-[#85652D]">
              Makna yang dibawa pulang
            </p>
            <h2 className="max-w-2xl text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Tumbuh sebagai pribadi.
              <br />
              Berdampak dalam kepemimpinan.
            </h2>
            <div className="mt-9 grid gap-x-10 gap-y-7 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="border-t border-navy-900/15 pt-5"
                >
                  <h3 className="text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 max-w-sm text-pretty text-sm leading-7 text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="perbedaan"
          className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="mb-4 text-sm font-medium text-[#85652D]">
                Nilai tambah BinaJourney
              </p>
              <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                Ibadah yang bermakna.
                <br />
                Perubahan yang dirawat.
              </h2>
              <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-slate-600 sm:text-base">
                SLJ melengkapi pengalaman perjalanan dengan rencana perubahan
                dan pendampingan yang berlanjut saat Anda kembali.
              </p>
            </div>
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-4 border-b border-navy-900/15 pb-4 text-sm font-semibold">
                <p className="text-slate-600">Perjalanan Umrah</p>
                <p>Pendampingan SLJ</p>
              </div>
              <dl>
                {comparisons.map((item) => (
                  <div
                    key={item.aspect}
                    className="grid grid-cols-2 gap-x-4 border-b border-navy-900/10 py-4 text-sm leading-6"
                  >
                    <dt className="col-span-2 mb-2 text-xs font-medium text-[#85652D]">
                      {item.aspect}
                    </dt>
                    <dd className="text-slate-600">
                      <span className="sr-only">Perjalanan Umrah, </span>
                      {item.journey}
                    </dd>
                    <dd className="flex items-start gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-[#85652D]"
                      />
                      <span>
                        <span className="sr-only">Pendampingan SLJ, </span>
                        {item.slj}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section
          id="durasi"
          className="scroll-mt-24 px-5 pb-16 sm:px-8 sm:pb-24 lg:px-12"
        >
          <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-2xl bg-navy-900 px-6 py-10 text-white sm:p-10 lg:p-12">
            <img
              src="/bg-filosofi.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width="1810"
              height="869"
              className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-40"
            />
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="mb-4 text-sm text-[#E4C992]">
                  Perjalanan 90 hari
                </p>
                <h2 className="max-w-xl text-balance text-3xl font-medium leading-tight sm:text-4xl">
                  Beri perubahan
                  <br />
                  waktu untuk tumbuh.
                </h2>
                <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-slate-300">
                  Mengenali diri, mencoba langkah baru, lalu menguatkannya dalam
                  keseharian. Perkembangan ditinjau bersama melalui tiga
                  checkpoint bulanan.
                </p>
              </div>
              <ol className="grid content-center divide-y divide-white/15">
                {[
                  ["30", "Tinjau langkah awal"],
                  ["60", "Perkuat konsistensi"],
                  ["90", "Refleksikan perkembangan"],
                ].map(([day, label]) => (
                  <li key={day} className="flex items-center gap-6 py-5">
                    <span className="w-20 shrink-0 text-xs text-[#E4C992]">
                      Hari ke-
                      <span className="ml-2 text-2xl font-medium text-white tabular-nums">
                        {day}
                      </span>
                    </span>
                    <span className="text-sm text-slate-200 sm:text-base">
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          id="sasaran"
          className="scroll-mt-24 border-t border-navy-900/10 bg-white px-5 py-12 sm:px-8 sm:py-16 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-sm font-medium text-[#85652D]">
                Untuk siapa?
              </p>
              <h2 className="max-w-lg text-balance text-2xl font-semibold leading-snug sm:text-3xl">
                Untuk Anda yang ingin bertumbuh dalam memimpin diri dan
                menjalankan amanah.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
                Program pendampingan dapat diikuti melalui perusahaan atau mitra
                penyelenggara.
              </p>
            </div>
            <ul className="grid grid-cols-2 content-center gap-x-5 text-sm leading-6 text-slate-600">
              {audiences.map((audience) => (
                <li key={audience} className="border-b border-slate-200 py-4">
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <PricingSection
          trialClosed={trialClosed}
          trialHref={startHref}
          trialLabel={isLoggedIn ? "Buka perjalanan" : undefined}
        />

        <section
          id="faq"
          className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3 lg:gap-16">
            <div>
              <p className="mb-4 text-sm font-medium text-[#85652D]">
                Pertanyaan umum
              </p>
              <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                Sebelum Anda
                <br />
                memulai.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                Kenali program, uji coba, dan cara mengikuti perjalanannya.
              </p>
              <Link
                href="/panduan"
                className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-semibold underline decoration-navy-900/25 underline-offset-4 hover:decoration-navy-900"
              >
                Baca panduan pengguna
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="border-t border-slate-200 lg:col-span-2">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  name="slj-faq"
                  className="group border-b border-slate-200"
                >
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium leading-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 sm:text-base [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-6 text-pretty text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="kontak"
          className="scroll-mt-24 bg-navy-900 px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-12"
        >
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5 lg:items-center lg:gap-16">
            <div className="lg:col-span-3">
              <p className="mb-4 text-sm font-medium text-[#E4C992]">
                Langkah baik dimulai dari sini
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
                Temukan perjalanan
                <br />
                yang sesuai untuk Anda.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Mulai dari aktivitas spiritual harian, atau bicarakan kebutuhan
                pendampingan diri dan tim Anda bersama BinaJourney.
              </p>
            </div>
            <div className="grid gap-3 lg:col-span-2">
              <Link
                href={startHref}
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {startLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href="https://wa.me/628118494545"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/30 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Diskusikan dengan tim BinaJourney
                <MessageCircle
                  aria-hidden="true"
                  className="size-4 shrink-0 text-[#E4C992]"
                />
              </a>
              <p className="mt-1 text-center text-xs leading-6 text-slate-300">
                Konsultasi program melalui WhatsApp
              </p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
