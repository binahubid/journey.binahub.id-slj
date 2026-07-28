'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function getEmailProviderInfo(email: string): { name: string; url: string } {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail')) {
    return { name: 'Buka Gmail', url: 'https://mail.google.com' };
  }
  if (domain.includes('yahoo')) {
    return { name: 'Buka Yahoo Mail', url: 'https://mail.yahoo.com' };
  }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return { name: 'Buka Outlook Mail', url: 'https://outlook.live.com' };
  }
  if (domain.includes('icloud')) {
    return { name: 'Buka iCloud Mail', url: 'https://www.icloud.com/mail' };
  }
  return { name: 'Buka Inbox Email', url: 'https://mail.google.com' };
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const provider = getEmailProviderInfo(email);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 font-sans">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 bg-grid-slate opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C79A3C]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-[#C79A3C]/15 blur-3xl" />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center">
          <img
            src="/BinaJourney_logo.webp"
            alt="BinaJourney Logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 text-center shadow-xl shadow-slate-300/30 backdrop-blur sm:p-8 space-y-6">
          {/* Animated Mail Icon Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-[#C79A3C] border border-[#C79A3C]/30 shadow-xs">
            <svg className="h-8 w-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Cek Email Anda
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Kami telah mengirimkan tautan konfirmasi pendaftaran ke alamat email:
            </p>
            {email && (
              <div className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#0B2C6B] border border-slate-200">
                {email}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-50/60 border border-[#C79A3C]/20 p-3.5 text-left text-[11px] text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-[#0B2C6B]">Langkah selanjutnya:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Buka inbox atau folder <strong>Spam</strong> email Anda.</li>
              <li>Klik tombol <strong>Konfirmasi Email / Verifikasi</strong>.</li>
              <li>Anda akan otomatis diarahkan ke perjalanan SLJ OS.</li>
            </ol>
          </div>

          {/* Email Provider Shortcut Button */}
          <div className="space-y-3 pt-2">
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#C79A3C] to-[#A87E2A] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#C79A3C]/20 transition-all hover:from-[#B58A32] hover:to-[#966E22] hover:shadow-xl hover:shadow-[#C79A3C]/30"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>{provider.name}</span>
            </a>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#C79A3C] transition-colors py-1"
            >
              <span>Sudah konfirmasi? Masuk ke Akun</span>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#C79A3C] border-t-transparent rounded-full" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
