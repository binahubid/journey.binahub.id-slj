import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan dan Kebijakan Privasi — BinaJourney",
  description:
    "Syarat & Ketentuan Penggunaan dan Kebijakan Privasi Platform BinaJourney oleh PT Binahub Solusi Transformasi (BinaHub).",
};

const sk = [
  {
    title: "1. Ruang Lingkup",
    body: "Platform digunakan untuk mendukung penyelenggaraan Program SLJ bagi peserta individu maupun peserta program korporat.",
  },
  {
    title: "2. Akun Pengguna",
    body: "Peserta wajib memberikan data yang benar, menjaga kerahasiaan akun, serta bertanggung jawab atas seluruh aktivitas yang dilakukan melalui akun miliknya.",
  },
  {
    title: "3. Program Korporat",
    body: "Apabila Peserta mengikuti Program yang diselenggarakan dan/atau dibiayai oleh Perusahaan Penyelenggara, salah satu ruang lingkup layanan Program adalah penyampaian laporan perkembangan kepada Perusahaan Penyelenggara sebagaimana diatur dalam dokumen ini. Dengan menyetujui Syarat & Ketentuan ini, Peserta menyetujui ruang lingkup layanan tersebut sebagai bagian dari pelaksanaan Program.",
  },
  {
    title: "4. Monitoring dan Pelaporan",
    body: "Laporan kepada Perusahaan Penyelenggara dapat meliputi partisipasi, penyelesaian aktivitas, pencapaian target, perkembangan transformasi, serta rekomendasi pengembangan. BinaHub tidak membagikan isi verbatim jurnal refleksi, isi lengkap PTP, catatan coaching, catatan muhasabah, maupun informasi pribadi yang tidak berkaitan dengan tujuan Program tanpa persetujuan tertulis Peserta atau apabila diwajibkan oleh hukum.",
  },
  {
    title: "5. Status Coach",
    body: "Coach bertindak sebagai fasilitator pembelajaran dan bukan psikolog, psikiater, tenaga kesehatan mental, penasihat hukum, maupun penasihat keuangan.",
  },
  {
    title: "6. Kepemilikan PTP",
    body: "Personal Transformation Project (PTP), refleksi pribadi, target perubahan, dan catatan perkembangan tetap menjadi milik Peserta. Peserta memberikan lisensi terbatas kepada BinaHub untuk menyimpan, mengolah, menampilkan kepada Coach, melakukan monitoring, evaluasi, dan pelaporan sesuai tujuan Program.",
  },
  {
    title: "7. Hak Kekayaan Intelektual",
    body: "Kecuali Personal Transformation Project (PTP) milik Peserta sebagaimana diatur dalam Pasal 6, seluruh materi Program, metode pembelajaran, modul, asesmen, konten, desain, dan Platform BinaJourney merupakan hak kekayaan intelektual milik PT Binahub Solusi Transformasi (BinaHub) dan dilindungi oleh peraturan perundang-undangan yang berlaku.",
  },
  {
    title: "8. Penangguhan Akun",
    body: "BinaHub berhak membatasi atau menonaktifkan akun yang melanggar ketentuan ini.",
  },
  {
    title: "9. Penyelesaian Sengketa",
    body: "Para pihak mengutamakan musyawarah. Apabila dalam waktu 30 (tiga puluh) hari tidak tercapai penyelesaian, sengketa diselesaikan melalui Pengadilan Negeri Jakarta Selatan sesuai hukum Republik Indonesia.",
  },
];

const privasi = [
  {
    title: "Pengendali Data",
    body: "PT Binahub Solusi Transformasi (BinaHub) merupakan Pengendali Data, pemilik Platform BinaJourney, dan penyelenggara Program Spiritual Leadership Journey.",
  },
  {
    title: "Data yang Diproses",
    body: "Identitas peserta, perusahaan asal, hasil asesmen, PTP, refleksi, aktivitas coaching, monitoring perkembangan, evaluasi program, serta data teknis penggunaan platform.",
  },
  {
    title: "Tujuan Pengolahan",
    body: "Penyelenggaraan Program, coaching, monitoring, evaluasi, pelaporan kepada Perusahaan Penyelenggara sesuai ruang lingkup Program, peningkatan layanan, audit, dan pemenuhan kewajiban hukum.",
  },
  {
    title: "Akses Data",
    body: "Data dapat diakses oleh Peserta, Coach, Administrator, dan personel BinaHub yang berwenang. Untuk Program Korporat, perusahaan hanya menerima informasi perkembangan sesuai ruang lingkup Program. Isi verbatim jurnal, isi lengkap PTP, dan catatan coaching tidak dibagikan tanpa persetujuan tertulis Peserta atau apabila diwajibkan oleh hukum.",
  },
  {
    title: "Hak Peserta",
    body: "Peserta berhak mengakses, memperoleh salinan, memperbarui, memperbaiki, membatasi pemrosesan, atau mengajukan penghapusan Data Pribadi sesuai ketentuan hukum, selama Data Pribadi tersebut masih diproses atau disimpan oleh BinaHub.",
  },
  {
    title: "Retensi Data",
    body: "Data disimpan paling lama 12 bulan setelah Program berakhir, kecuali diwajibkan lebih lama oleh hukum atau diperlukan untuk audit maupun penyelesaian sengketa.",
  },
  {
    title: "Data Agregat",
    body: "BinaHub dapat menggunakan data yang telah dianonimkan atau diagregasi untuk analisis statistik, evaluasi efektivitas Program, penelitian internal, dan pengembangan layanan, sepanjang tidak dapat secara wajar digunakan untuk mengidentifikasi Peserta tertentu.",
  },
  {
    title: "Transfer Data",
    body: "Apabila BinaHub menggunakan penyedia layanan atau infrastruktur teknologi di luar wilayah Indonesia, BinaHub akan memastikan pemrosesan Data Pribadi dilakukan sesuai ketentuan peraturan perundang-undangan mengenai transfer data lintas negara.",
  },
  {
    title: "Keamanan",
    body: "BinaHub menerapkan langkah teknis dan administratif yang wajar untuk melindungi Data Pribadi serta memiliki prosedur penanganan insiden keamanan sesuai ketentuan hukum.",
  },
  {
    title: "Kerahasiaan Coach",
    body: "Seluruh Coach BinaJourney terikat kewajiban menjaga kerahasiaan informasi peserta dan hanya mengakses data yang diperlukan untuk pelaksanaan Program.",
  },
];

const lampiranExcluded = [
  "Isi verbatim jurnal refleksi",
  "Isi lengkap Personal Transformation Project (PTP)",
  "Catatan coaching",
  "Catatan muhasabah",
  "Informasi pribadi di luar tujuan Program",
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F0EDE6] font-sans text-[#0F1E3D]">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-[#0F1E3D]/10 bg-[#F0EDE6]/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F1E3D]/60 transition-colors hover:text-[#C79A3C]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Document paper */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-14">
        <article className="bg-white shadow-[0_1px_2px_rgba(15,30,61,0.06),0_12px_40px_-12px_rgba(15,30,61,0.18)] ring-1 ring-[#0F1E3D]/10">
          {/* ─── KOP SURAT ─── */}
          <div className="border-b-4 border-[#C79A3C] px-6 pb-6 pt-8 md:px-12 md:pt-10">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <img
                  src="/binahub_logo.webp"
                  alt="BinaHub Logo"
                  className="h-12 w-auto object-contain md:h-14"
                />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm font-extrabold uppercase tracking-wide text-[#0F1E3D] md:text-base">
                  PT Binahub Solusi Transformasi (BinaHub)
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#C79A3C]">
                  Platform BinaJourney
                </p>
              </div>
            </div>
          </div>

          {/* ─── JUDUL DOKUMEN ─── */}
          <div className="px-6 py-8 md:px-12 md:py-10">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C79A3C]">
                Versi 1.1
              </p>
              <h1 className="mx-auto mt-3 max-w-2xl text-xl font-extrabold uppercase leading-snug tracking-tight text-[#0F1E3D] md:text-[24px] md:leading-snug">
                Syarat &amp; Ketentuan Penggunaan dan Kebijakan Privasi
              </h1>
              <div className="mx-auto mt-3 h-px w-24 bg-[#C79A3C]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0F1E3D]/50">
                Platform BinaJourney
              </p>
            </div>

            {/* Intro */}
            <p className="mt-8 text-justify text-[13px] leading-[1.9] text-[#0F1E3D]/80 md:text-sm">
              PT Binahub Solusi Transformasi (BinaHub) adalah pemilik Platform BinaJourney dan penyelenggara Program
              Spiritual Leadership Journey (SLJ). Platform ini digunakan untuk mendukung pembelajaran, coaching,
              monitoring, evaluasi, dan Personal Transformation Project (PTP).
            </p>

            {/* ─── BAGIAN A: SYARAT & KETENTUAN ─── */}
            <section id="syarat-ketentuan" className="mt-10 scroll-mt-20">
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#0F1E3D] md:text-xl">
                A. Syarat &amp; Ketentuan
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1 w-10 bg-[#C79A3C]" />
                <span className="h-px flex-1 bg-[#0F1E3D]/15" />
              </div>
              <div className="mt-6 space-y-0">
                {sk.map((item) => (
                  <div key={item.title} className="pb-5">
                    <h3 className="text-[13px] font-bold text-[#0F1E3D] md:text-sm">{item.title}</h3>
                    <p className="mt-1.5 text-justify text-[13px] leading-[1.9] text-[#0F1E3D]/80 md:text-sm">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── BAGIAN B: KEBIJAKAN PRIVASI ─── */}
            <section id="kebijakan-privasi" className="mt-10 scroll-mt-20">
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#0F1E3D] md:text-xl">
                B. Kebijakan Privasi
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1 w-10 bg-[#C79A3C]" />
                <span className="h-px flex-1 bg-[#0F1E3D]/15" />
              </div>
              <div className="mt-6 space-y-0">
                {privasi.map((item) => (
                  <div key={item.title} className="pb-5">
                    <h3 className="text-[13px] font-bold text-[#0F1E3D] md:text-sm">{item.title}</h3>
                    <p className="mt-1.5 text-justify text-[13px] leading-[1.9] text-[#0F1E3D]/80 md:text-sm">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── LAMPIRAN ─── */}
            <section id="lampiran" className="mt-10 scroll-mt-20">
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#0F1E3D] md:text-xl">
                Lampiran — Notice Registrasi Program Korporat
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1 w-10 bg-[#C79A3C]" />
                <span className="h-px flex-1 bg-[#0F1E3D]/15" />
              </div>
              <div className="mt-6 space-y-3 text-justify text-[13px] leading-[1.9] text-[#0F1E3D]/80 md:text-sm">
                <p>
                  Anda mengikuti Spiritual Leadership Journey sebagai bagian dari program pengembangan SDM yang
                  diselenggarakan dan/atau dibiayai oleh perusahaan Anda.
                </p>
                <p>
                  Selama Program berlangsung, BinaHub akan menyampaikan laporan perkembangan kepada perusahaan sesuai
                  ruang lingkup yang dijelaskan dalam Syarat &amp; Ketentuan dan Kebijakan Privasi.
                </p>
                <p className="font-semibold text-[#0F1E3D]">Laporan tersebut tidak mencakup:</p>
                <ul className="space-y-2">
                  {lampiranExcluded.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 text-[#A87E2A] font-bold">–</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0F1E3D]/10 bg-[#F0EDE6]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-[#0F1E3D]/50 md:flex-row md:px-6">
          <span>
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-bold text-[#0F1E3D]">
              Bina<span className="text-[#C79A3C]">Hub</span>
            </span>
            . PT Binahub Solusi Transformasi.
          </span>
          <nav className="flex items-center gap-5 text-[10px] font-semibold uppercase tracking-widest">
            <Link href="/" className="transition-colors hover:text-[#C79A3C]">
              Beranda
            </Link>
            <Link href="#syarat-ketentuan" className="transition-colors hover:text-[#C79A3C]">
              Syarat &amp; Ketentuan
            </Link>
            <Link href="#kebijakan-privasi" className="transition-colors hover:text-[#C79A3C]">
              Kebijakan Privasi
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
