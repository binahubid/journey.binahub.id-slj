import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Bell,
  Download,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Panduan mulai SLJ — BinaJourney",
  description:
    "Panduan singkat untuk memulai uji coba spiritual SLJ, mencatat ibadah, menulis refleksi, dan mengaktifkan pengingat.",
};
const steps = [
  {
    title: "Buat akun atau masuk",
    body: "Buka halaman Daftar. Pilih akun Google atau gunakan email dan kata sandi. Jika mendaftar dengan email, buka email verifikasi terlebih dahulu, lalu masuk kembali.",
    example:
      "Gunakan akun yang sama setiap kali masuk agar catatan Anda tetap terhubung.",
    href: "/register",
    action: "Buka halaman daftar",
  },
  {
    title: "Aktifkan uji coba 14 hari",
    body: "Pilih Uji coba gratis, isi nama lengkap, lalu pilih kota untuk jadwal salat. Tekan Mulai 14 hari gratis. Masa uji coba dimulai pada saat tombol tersebut berhasil diproses.",
    example:
      "Contoh: saat berada di Makkah, isi kota Makkah. Jadwal menggunakan waktu Arab Saudi.",
    href: "/onboarding",
    action: "Siapkan perjalanan",
  },
  {
    title: "Catat ibadah hari ini",
    body: "Di beranda trial, pilih Salat, Al-Qur’an, atau Hadits. Pada Salat, tekan nama salat yang sudah dikerjakan. Tekan lagi jika ingin membatalkan tanda. Gunakan Kelola salat sunnah untuk menampilkan pilihan tambahan.",
    example:
      "Pada Al-Qur’an, isi bacaan Anda dan simpan. Pada Hadits, baca isinya, lalu tandai sudah dibaca.",
    href: "/trial",
    action: "Buka perjalanan saya",
  },
  {
    title: "Tutup hari dengan refleksi",
    body: "Pilih Refleksi, lalu Buka jurnal refleksi. Tulis pengalaman dan pelajaran hari ini, pilih suasana hati Anda, lalu simpan jurnal. Anda dapat melihat kembali jurnal yang sudah ditulis.",
    example:
      "Contoh: Hari ini saya belajar menjaga ketenangan. Besok saya ingin lebih sabar mendengarkan.",
    href: "/journal",
    action: "Buka jurnal",
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-dvh bg-[#F5F7FB] px-5 pb-12 pt-6 text-navy-900 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-9 flex items-center justify-between gap-3">
          <Link href="/">
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney"
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
          >
            Perjalanan saya <ArrowRight className="h-4 w-4" />
          </Link>
        </header>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Beranda
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#8B6724]">
          Panduan peserta
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Mulai kebiasaan baik,
          <br />
          selangkah demi selangkah.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
          SLJ membantu Anda mencatat ibadah dan merenungkan keseharian. Uji coba
          spiritual tersedia selama 14 hari setelah diaktifkan. Ikuti empat
          langkah berikut untuk mulai.
        </p>
        <ol className="mt-9 space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold">
                  {index + 1}
                </span>
                <div>
                  <h2 className="pt-1 text-lg font-semibold">{step.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.body}
                  </p>
                  <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                    {step.example}
                  </p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                  >
                    {step.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-semibold">
            Siapkan agar nyaman dipakai setiap hari
          </h2>
          <div className="mt-5 space-y-5">
            {[
              {
                icon: MapPin,
                title: "Periksa kota dan zona waktu",
                text: "Buka Pengaturan saat berpindah kota. Pilih Makkah, Madinah, atau Jeddah saat berada di Arab Saudi. Cocokkan zona waktu dengan lokasi Anda sebelum memakai jadwal salat dan mencatat aktivitas.",
              },
              {
                icon: Bell,
                title: "Atur pengingat sesuai kebutuhan",
                text: "Buka Pengaturan, aktifkan jenis pengingat yang diperlukan, lalu simpan. Izinkan notifikasi pada perangkat jika diminta. Pengingat mengikuti jadwal dan izin perangkat Anda.",
              },
              {
                icon: Download,
                title: "Tambahkan ke layar utama HP",
                text: "Di Android, buka menu browser dan pilih Instal aplikasi atau Tambahkan ke layar utama. Di iPhone, buka melalui Safari, pilih Bagikan, lalu Tambahkan ke Layar Utama. Buka SLJ dari ikon tersebut untuk penggunaan berikutnya.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/settings"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
          >
            Buka Pengaturan <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="mt-9 space-y-4">
          <h2 className="text-xl font-semibold">Yang perlu Anda ketahui</h2>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            {[
              "Trial gratis dan tidak meminta pembayaran. Setiap akun dapat memulainya satu kali.",
              "Fitur spiritual dan jurnal tersedia selama trial aktif. Area pengembangan lain dapat dilihat sebagai pratinjau.",
              "Saat 14 hari berakhir, pencatatan trial berhenti. Hubungi BinaHub untuk melanjutkan program pendampingan.",
              "Sudah menerima kode program? Pilih Kode program pada halaman mulai. Catatan spiritual Anda tidak dihapus saat melanjutkan program.",
              "Jika perubahan gagal disimpan, periksa koneksi dan pesan yang muncul. Muat ulang halaman untuk memastikan catatan terakhir yang tersimpan.",
            ].map((text) => (
              <li key={text} className="flex gap-2">
                <Check className="mt-1.5 h-4 w-4 shrink-0 text-slate-500" />
                {text}
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-9 rounded-2xl bg-navy-900 p-6 text-white sm:p-8">
          <BookOpen className="h-6 w-6 text-[#DAB568]" />
          <h2 className="mt-4 text-2xl font-semibold">Siap memulai?</h2>
          <p className="mt-2 text-sm leading-7 text-blue-100">
            Luangkan beberapa menit hari ini untuk satu langkah baik.
          </p>
          <Link
            href="/onboarding"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-navy-900"
          >
            Mulai perjalanan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <footer className="mt-10 flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} BinaHub</span>
          <Link href="/terms" className="underline underline-offset-4">
            Syarat & privasi
          </Link>
        </footer>
      </div>
    </main>
  );
}
