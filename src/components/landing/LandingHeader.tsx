"use client";

import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";

const links = [
  { href: "#why-slj", label: "Tentang SLJ" },
  { href: "#tahapan", label: "Perjalanan" },
  { href: "#pricing", label: "Pilihan program" },
  { href: "/panduan", label: "Panduan" },
];

export function LandingHeader({
  startHref,
  startLabel,
}: {
  startHref: string;
  startLabel: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-900/10 bg-warm-bg">
      <div className="relative mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="BinaJourney, beranda"
          className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
        >
          <img
            src="/BinaJourney_logo.webp"
            alt="BinaJourney by BinaHub"
            width="2038"
            height="630"
            className="h-auto w-32 sm:w-36"
          />
        </Link>
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-6 text-sm font-medium text-slate-600 xl:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={startHref === "/dashboard" ? "/dashboard" : "/login"}
            className="inline-flex min-h-11 items-center text-sm font-medium text-navy-900 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
          >
            {startHref === "/dashboard" ? "Akun" : "Masuk"}
          </Link>
          <Link
            href={startHref}
            className="hidden min-h-11 items-center justify-center gap-3 rounded-lg bg-navy-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900 sm:inline-flex"
          >
            {startLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <details
            className="group xl:hidden"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.removeAttribute("open");
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary
              aria-label="Menu navigasi"
              className="grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-navy-900/15 text-navy-900 hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </summary>
            <nav
              aria-label="Navigasi seluler"
              className="absolute left-5 right-5 top-full mt-2 grid rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:left-auto sm:w-72"
            >
              {[
                ...links,
                { href: "#ekosistem", label: "Pendampingan" },
                { href: "#faq", label: "Pertanyaan umum" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                  className="flex min-h-12 items-center justify-between rounded-lg px-4 text-sm font-medium text-navy-900 hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-900"
                >
                  {link.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-slate-400"
                  />
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
