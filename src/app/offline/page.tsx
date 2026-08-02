import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-6">
      <section className="w-full max-w-md border border-[#EAE5D9] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">SLJ BinaJourney</p>
        <h1 className="mt-3 text-2xl font-extrabold text-[#071A33]">Koneksi sedang terputus</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sambungkan kembali perangkat ke internet untuk memuat data journey terbaru.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center bg-[#071A33] px-5 text-xs font-bold text-white"
        >
          Coba Kembali
        </Link>
      </section>
    </main>
  );
}
