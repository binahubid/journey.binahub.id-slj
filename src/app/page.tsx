"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Compass,
  BookOpen,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Heart,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Globe,
  Clock,
  Activity,
  CheckCircle,
  TrendingUp,
  Target,
  GraduationCap,
  FileText,
  UserCheck,
  Calendar,
  ChevronDown,
  Award,
  Youtube,
  Linkedin,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setIsLoggedIn(true);
        }
      });
    } catch {
      // Safe fallback if env variables or auth client fail
    }
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs: { question: string; answer: string }[] = [
    {
      question: "Apa itu Spiritual Leadership Journey (SLJ)?",
      answer:
        "SLJ adalah program pendampingan 90 hari dari BinaJourney yang mengubah pengalaman Umrah menjadi perjalanan transformasi kepemimpinan yang berkelanjutan — melalui empat tahap: Muhasabah, Niyyah, Mujahadah, dan Istiqamah — didampingi coach, Sahabat Safar, dan platform digital untuk mencatat progres harian.",
    },
    {
      question: "Mengapa pendampingan berlangsung selama 90 hari?",
      answer:
        "90 hari adalah rentang yang cukup untuk mengubah niat menjadi kebiasaan yang bertahan — bukan sekadar euforia sesaat setelah pulang dari Tanah Suci. Program dibagi ke tiga checkpoint bulanan agar perubahan berjalan bertahap dan terukur, bukan sekaligus.",
    },
    {
      question: "Apakah saya akan didampingi oleh coach?",
      answer:
        "Ya. Setiap peserta didampingi coach personal sejak sebelum keberangkatan (coaching debrief) hingga rutin setelah pulang (coaching & mentoring), memberikan ulasan dan dukungan secara personal di sepanjang 90 hari.",
    },
    {
      question: "Bagaimana jika saya tertinggal atau melewatkan beberapa hari?",
      answer:
        "Tidak masalah — SLJ dirancang tanpa rasa bersalah saat ada hari yang terlewat. Sistem hanya menandai untuk membantu Anda dan coach tahu kapan perlu perhatian lebih, bukan untuk menghakimi. Anda bisa melanjutkan kapan saja.",
    },
    {
      question: "Apakah saya harus membuka aplikasi setiap hari?",
      answer:
        "Tidak wajib, tapi disarankan — mengisi habit harian dan jurnal singkat membantu Anda tetap terhubung dengan niat awal. Coach dan Sahabat Safar juga akan menghubungi Anda jika progres perlu didampingi lebih intensif.",
    },
    {
      question: "Mengapa perubahan sering tidak bertahan setelah umrah?",
      answer:
        "Karena semangat spiritual yang muncul di Tanah Suci sering tidak punya struktur pendampingan saat kembali ke rutinitas. SLJ hadir mengisi celah itu — lewat rencana aksi tertulis (PTP), coach, dan Sahabat Safar yang saling menjaga selama 90 hari setelah pulang.",
    },
    {
      question: "Apakah SLJ hanya untuk jamaah umrah?",
      answer:
        "Program dirancang untuk peserta yang menjalani perjalanan Umrah bersama BinaJourney, karena tahap Muhasabah, Niyyah, dan Mujahadah terjadi di sepanjang persiapan dan pelaksanaan perjalanan tersebut. Tahap Istiqamah setelah pulang adalah inti dari pendampingan digitalnya. Pendaftaran dilakukan lewat perusahaan atau mitra penyelenggara Anda, bukan langsung secara mandiri.",
    },
    {
      question: "Apa itu Kode Program dan dari mana saya mendapatkannya?",
      answer:
        "Kode Program adalah kode unik yang menghubungkan akun Anda ke program SLJ di batch keberangkatan tertentu. Kode ini diberikan oleh perusahaan, komunitas, atau mitra penyelenggara yang mendaftarkan Anda — bukan dibeli langsung lewat website. Setelah membuat akun, Anda memasukkan Kode Program ini untuk mengaktifkan akses ke program.",
    },
    {
      question: "Apa yang akan saya lakukan selama 90 hari?",
      answer:
        "Empat tahap: Muhasabah (mengenali diri sebelum berangkat), Niyyah (meluruskan arah dan menyusun Personal Transformation Project menjelang berangkat), Mujahadah (menjalani ibadah dan perubahan bermakna di Madinah & Makkah), dan Istiqamah (menjaga perubahan jadi kebiasaan setelah pulang ke rumah) — semuanya didampingi coach dan tercatat di platform digital.",
    },
    {
      question: "Apakah data jurnal dan refleksi saya bersifat pribadi?",
      answer:
        "Ya, jurnal dan hasil Muhasabah Anda bersifat privat secara default. Anda yang memutuskan apakah ingin membagikannya ke coach untuk pendampingan lebih personal — tidak otomatis terbuka.",
    },
    {
      question: "Apakah saya bisa mengubah Personal Transformation Project (PTP)?",
      answer:
        "PTP adalah komitmen yang Anda tulis sendiri di awal perjalanan, jadi perubahannya memang bisa diajukan — misalnya jika target awal ternyata kurang realistis — tapi melalui persetujuan coach, supaya PTP tetap menjadi kontrak perubahan yang serius, bukan berubah sepihak.",
    },
    {
      question: "Bagaimana progres saya diukur?",
      answer:
        "Lewat kombinasi completion habit harian, jurnal, dan tiga checkpoint bulanan (Hari 30, 60, 90) dengan status On Track atau Need Support — bukan skor yang menghakimi, tapi penanda untuk tahu kapan Anda butuh dukungan lebih.",
    },
    {
      question: "Bagaimana cara bergabung?",
      answer:
        "Buat akun, lalu masukkan Kode Program yang diberikan oleh perusahaan atau mitra penyelenggara yang mendaftarkan Anda untuk mengaktifkan akses. Belum punya Kode Program? Hubungi tim BinaHub untuk konsultasi program dan pendaftaran perusahaan/kelompok Anda terlebih dahulu.",
    },
    {
      question: "Apa yang membuat SLJ berbeda dari aplikasi habit tracker biasa?",
      answer:
        "SLJ bukan sekadar checklist ibadah — setiap kebiasaan harian terhubung langsung ke niat dan target 90 hari yang Anda tulis sendiri di PTP, didampingi coach dan Sahabat Safar nyata, bukan notifikasi otomatis semata.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#071A33] flex flex-col font-sans selection:bg-[#C79A3C]/20">
      {/* ─── HEADER / NAVBAR (FIXED TOP) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-md transition-all border-b border-slate-200/40">
        <div className="w-full px-6 md:px-12 lg:px-16 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link href="/" className="inline-block group py-1">
              <img
                src="/BinaJourney_logo.webp"
                alt="BinaJourney Logo"
                className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10 text-xs sm:text-sm font-medium text-slate-600">
            <a href="#tahapan" className="hover:text-[#071A33] transition-colors">
              Journey
            </a>
            <a href="#manfaat" className="hover:text-[#071A33] transition-colors">
              Ekosistem
            </a>
            <a href="#sasaran" className="hover:text-[#071A33] transition-colors">
              Target Program
            </a>
            <a href="#faq" className="hover:text-[#071A33] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <button className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0B2C6B] hover:bg-[#071A33] text-white text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] px-6 py-2.5 shadow-[0_18px_42px_-20px_rgba(11,44,107,0.8)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95">
                {isLoggedIn ? "Dashboard" : "Get Started"}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 sm:pt-24">
        {/* ─── HERO SECTION (FULL WIDTH BANNER WITH LEFT-ALIGNED TEXT BLOCK) ─── */}
        <section id="tentang" className="pt-6 sm:pt-10 pb-0 px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative w-full overflow-hidden">
          {/* Hanging Ribbon Badge (Pita Navy - Gold Border & Text di Sisi Kanan) */}
          <div className="absolute top-0 right-8 sm:right-14 md:right-20 lg:right-28 z-20 pointer-events-none">
            <div className="bg-[#0B2C6B] text-[#C79A3C] border-x-2 border-b-2 border-[#C79A3C] shadow-xl rounded-b-2xl px-4 py-3 sm:px-5 sm:py-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#C79A3C]">
                PROGRAM
              </span>
              <span className="text-xl sm:text-3xl font-extrabold text-[#C79A3C] leading-none my-0.5 tracking-tight font-serif">
                90 HARI
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#C79A3C]/90">
                TRANSFORMASI
              </span>
            </div>
          </div>

          <div className="w-full text-left space-y-8">
            {/* Inset Text Block (Agak masuk ke dalam) */}
            <div className="pl-2 sm:pl-8 md:pl-12 lg:pl-16 max-w-4xl space-y-5">
              {/* Main Headline (1 Baris Saja - Gold Accent pada 'Journey') */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[clamp(2.4rem,4.2vw,4.2rem)] font-bold leading-[1.1] tracking-[-0.035em] text-[#071A33] max-w-5xl whitespace-nowrap">
                Spiritual Leadership{" "}
                <span className="relative inline-block px-1">
                  <span className="relative z-10">Journey</span>
                  <span className="absolute bottom-1 left-0 right-0 h-[48%] bg-[#C79A3C]/35 rounded-xs -z-0" aria-hidden="true" />
                </span>
              </h1>

              {/* Description (Warna Perjalanan 90 Hari diubah ke Gold #C79A3C) */}
              <div className="space-y-3 max-w-2xl pt-1">
                <p className="text-base sm:text-lg lg:text-xl font-normal text-[#C79A3C] leading-[1.5] tracking-[-0.01em]">
                  Perjalanan 90 Hari Mengubah Nilai Spiritual Menjadi Kepemimpinan Otentik dalam Kehidupan Sehari-hari.
                </p>
                <p className="text-[14px] lg:text-[17px] text-[#30405C] leading-[1.65] tracking-[-0.005em] font-normal">
                  Bukan sekadar perjalanan Umrah. Ini adalah perjalanan transformasi hati dan kepemimpinan yang berlanjut ketika Anda kembali ke rumah.
                </p>
              </div>

              {/* Sleek CTA Buttons (Matching website-prod hero button styles) */}
              <div className="pt-3 flex flex-wrap items-center gap-3.5">
                <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                  <button className="inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-[9px] bg-[#0B2C6B] px-7 text-[10px] md:text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_22px_56px_-30px_rgba(11,44,107,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#071A33] active:scale-95">
                    {isLoggedIn ? "Ke Dashboard" : "Mulai Perjalanan"} <ArrowRight className="h-4 w-4 text-[#C79A3C]" />
                  </button>
                </Link>
                <a href="#tahapan">
                  <button className="inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-[9px] border border-[#0B2C6B]/20 bg-white/80 px-7 text-[10px] md:text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#071A33] shadow-[0_18px_54px_-38px_rgba(11,44,107,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0B2C6B]/40 hover:bg-white">
                    Pelajari 4 Tahapan
                  </button>
                </a>
              </div>
            </div>

            {/* Hero Image Banner (Tinggi Dikurangi 15%, Rounded Top, Flat Bottom) */}
            <div className="w-full overflow-hidden rounded-t-[24px] sm:rounded-t-[36px] rounded-b-none border-t border-x border-slate-200/60 shadow-lg bg-white mt-8">
              <img
                src="/hero.webp"
                alt="Jamaah di depan Ka'bah"
                className="w-full h-[300px] sm:h-[440px] md:h-[540px] lg:h-[620px] object-cover object-[center_35%]"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ─── UNIFIED SECTION: FILOSOFI PROGRAM & ALUR TRANSFORMASI ─── */}
        <section id="tahapan" className="py-20 md:py-28 px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative border-b border-[#EAE5D9] w-full overflow-hidden">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <img
              src="/bg-3.webp"
              alt="Background Section 3"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 w-full pl-2 sm:pl-8 md:pl-12 lg:pl-16">
            {/* 1. QUOTE BLOCK */}
            <div className="text-center space-y-4 max-w-4xl mx-auto">
              <span className="text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                FILOSOFI PROGRAM
              </span>
              <span className="text-6xl sm:text-7xl font-serif text-[#C79A3C] block leading-none">&ldquo;</span>
              <blockquote className="text-2xl sm:text-3xl md:text-4xl font-serif italic leading-relaxed text-[#071A33] max-w-3xl mx-auto -mt-6">
                Perjalanan ke Baitullah mengubah cara kita memandang kehidupan. Istiqamah menentukan bagaimana kita menjalaninya.
              </blockquote>
              <p className="text-xs uppercase tracking-[0.25em] text-[#C79A3C] font-extrabold pt-3 block">
                &mdash; BINAJOURNEY LEADERSHIP COUNCIL
              </p>
            </div>

            {/* 2. HAIRLINE DIVIDER */}
            <div className="my-14 sm:my-18 w-full border-t border-[#C79A3C]/20" />

            {/* 3. TIMELINE BLOCK (SPLIT LAYOUT: 25% LEFT TITLE HEADER, 75% RIGHT 2X2 GRID) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pt-4">
              {/* Left Column (25% / 3 cols) - Title Header */}
              <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#071A33] tracking-tight leading-tight">
                  Empat Tahapan Transformasi Spiritual
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                  Proses bertahap yang mengubah niat mendalam menjadi kebiasaan hidup berkelanjutan.
                </p>
              </div>

              {/* Right Column (75% / 9 cols) - 2x2 Grid Layout */}
              <div className="lg:col-span-9">
                {/* Desktop & Tablet: 2x2 Grid Layout */}
                <div className="hidden md:grid md:grid-cols-2 border-b border-[#C79A3C]/20 pb-4">
                  {/* Row 1, Col 1 - Muhasabah */}
                  <div className="p-6 lg:p-8 space-y-4 border-b md:border-r border-[#C79A3C]/20 pr-6 lg:pr-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          01 &bull; SEBELUM KEBERANGKATAN
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Muhasabah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider">Mengenali Diri</p>
                      </div>
                      <img
                        src="/icons/stage_01_muhasabah.png"
                        alt="Muhasabah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Menyadari kondisi diri secara jujur dan mendalam sebagai titik awal perubahan.
                    </p>
                  </div>

                  {/* Row 1, Col 2 - Niyyah */}
                  <div className="p-6 lg:p-8 space-y-4 border-b border-[#C79A3C]/20 pl-6 lg:pl-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          02 &bull; MENJELANG KEBERANGKATAN
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Niyyah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider">Meluruskan Arah</p>
                      </div>
                      <img
                        src="/icons/stage_02_niyyah.png"
                        alt="Niyyah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Menemukan alasan dan tujuan hidup yang lurus karena Allah, lalu merencanakan perubahan yang jelas.
                    </p>
                  </div>

                  {/* Row 2, Col 1 - Mujahadah */}
                  <div className="p-6 lg:p-8 space-y-4 md:border-r border-[#C79A3C]/20 pr-6 lg:pr-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          03 &bull; DI MADINAH & MAKKAH
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Mujahadah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider">Menjalani Perubahan</p>
                      </div>
                      <img
                        src="/icons/stage_03_mujahadah.png"
                        alt="Mujahadah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Mengalami ibadah Umrah secara bermakna, memperdalam hubungan dengan Allah, dan memperjuangkan perubahan diri.
                    </p>
                  </div>

                  {/* Row 2, Col 2 - Istiqamah */}
                  <div className="p-6 lg:p-8 space-y-4 pl-6 lg:pl-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          04 &bull; SETELAH PULANG KE RUMAH
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Istiqamah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider">Menjaga Perubahan</p>
                      </div>
                      <img
                        src="/icons/stage_04_istiqamah.png"
                        alt="Istiqamah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Mengimplementasikan perubahan dalam kehidupan sehari-hari secara konsisten dan berkelanjutan.
                    </p>
                  </div>
                </div>

                {/* Mobile Vertical Timeline */}
                <div className="block md:hidden border-l border-[#C79A3C]/40 pl-6 ml-3 space-y-12 relative">
                  {/* Stage 1 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[39px] top-0 bg-[#FAF8F4] p-1">
                      <img
                        src="/icons/stage_01_muhasabah.png"
                        alt="Muhasabah"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">01 &bull; SEBELUM KEBERANGKATAN</span>
                    <h3 className="font-bold text-[#071A33] text-xl">Muhasabah &bull; <span className="text-sm font-semibold text-[#C79A3C]">Mengenali Diri</span></h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Menyadari kondisi diri secara jujur dan mendalam sebagai titik awal perubahan.
                    </p>
                  </div>

                  {/* Stage 2 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[39px] top-0 bg-[#FAF8F4] p-1">
                      <img
                        src="/icons/stage_02_niyyah.png"
                        alt="Niyyah"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">02 &bull; MENJELANG KEBERANGKATAN</span>
                    <h3 className="font-bold text-[#071A33] text-xl">Niyyah &bull; <span className="text-sm font-semibold text-[#C79A3C]">Meluruskan Arah</span></h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Menemukan alasan dan tujuan hidup yang lurus karena Allah, lalu merencanakan perubahan yang jelas.
                    </p>
                  </div>

                  {/* Stage 3 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[39px] top-0 bg-[#FAF8F4] p-1">
                      <img
                        src="/icons/stage_03_mujahadah.png"
                        alt="Mujahadah"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">03 &bull; DI MADINAH & MAKKAH</span>
                    <h3 className="font-bold text-[#071A33] text-xl">Mujahadah &bull; <span className="text-sm font-semibold text-[#C79A3C]">Menjalani Perubahan</span></h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Mengalami ibadah Umrah secara bermakna, memperdalam hubungan dengan Allah, dan memperjuangkan perubahan diri.
                    </p>
                  </div>

                  {/* Stage 4 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[39px] top-0 bg-[#FAF8F4] p-1">
                      <img
                        src="/icons/stage_04_istiqamah.png"
                        alt="Istiqamah"
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">04 &bull; SETELAH PULANG KE RUMAH</span>
                    <h3 className="font-bold text-[#071A33] text-xl">Istiqamah &bull; <span className="text-sm font-semibold text-[#C79A3C]">Menjaga Perubahan</span></h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Mengimplementasikan perubahan dalam kehidupan sehari-hari secara konsisten dan berkelanjutan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PENDAMPINGAN YANG MENGUBAH ─── */}
        <section className="py-16 md:py-24 border-y border-[#EAE5D9] bg-[#FAF8F4]">
          <div className="max-w-landing mx-auto px-6 grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Photo */}
            <div className="md:col-span-7 overflow-hidden rounded-2xl border border-[#EAE5D9] shadow-md h-80 sm:h-[420px]">
              <img
                src="/masjid_pilgrims.webp"
                alt="Jamaah beribadah bersama di Masjidil Haram"
                className="object-cover h-full w-full transform hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>

            {/* Right Text */}
            <div className="md:col-span-5 space-y-4 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#071A33] tracking-tight leading-tight">
                Istiqamah lebih mudah dibangun bersama
              </h2>
              <p className="text-base sm:text-lg font-bold text-[#C79A3C]">
                Karena perubahan membutuhkan pendampingan.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Setelah pulang ke rumah, Coach dan Sahabat Safar saling menjaga dan menguatkan agar Anda tetap istiqamah — bukan untuk menghakimi, tapi untuk mendampingi ketika semangat mulai menurun.
              </p>
            </div>
          </div>
        </section>

        {/* ─── MANFAAT UNTUK ANDA (Matching max-width of section above: max-w-landing) ─── */}
        <section id="manfaat" className="py-20 md:py-28 px-6 bg-[#FAF8F4] relative border-t border-[#EAE5D9]">
          <div className="max-w-landing mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Column (25% / 3 cols) - Sticky Title Header */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#071A33] tracking-tight leading-tight">
                  Apa yang Anda Dapatkan
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                  Ekosistem pendampingan holistik selama 90 hari untuk mendukung pertumbuhan Anda.
                </p>
              </div>

              {/* Right Column (75% / 8 cols) - 1 Column Stack dengan Icon di Kanan & Dividing Lines */}
              <div className="lg:col-span-8">
                <div className="divide-y divide-[#C79A3C]/20 border-y border-[#C79A3C]/20">
                  {/* Item 1 */}
                  <div className="py-6 lg:py-8 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          01 &bull; PERSONAL COACHING
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Pendampingan Personal Coach</h3>
                      </div>
                      <Users className="h-10 w-10 text-[#C79A3C] shrink-0 stroke-[1.7]" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Coach mendampingi dari Coaching Debrief sebelum berangkat hingga Coaching & Mentoring rutin setelah pulang, dengan ulasan berkala secara personal.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="py-6 lg:py-8 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          02 &bull; LEARNING COMMUNITY
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Learning Community</h3>
                      </div>
                      <BookOpen className="h-10 w-10 text-[#C79A3C] shrink-0 stroke-[1.7]" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Ruang belajar bersama peserta lain dan Sahabat Safar untuk saling menguatkan dan berbagi refleksi sepanjang 90 hari.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="py-6 lg:py-8 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          03 &bull; MONITORING & REFLECTION
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Monitoring & Reflection</h3>
                      </div>
                      <Calendar className="h-10 w-10 text-[#C79A3C] shrink-0 stroke-[1.7]" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Evaluasi bulanan (Hari 30, 60, 90) dengan penanda On Track / Need Support tanpa rasa bersalah.
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="py-6 lg:py-8 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          04 &bull; MONTHLY COACHING
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Coaching Bulanan</h3>
                      </div>
                      <GraduationCap className="h-10 w-10 text-[#C79A3C] shrink-0 stroke-[1.7]" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Sesi coaching terjadwal setiap bulan untuk meninjau progres dan menyesuaikan rencana aksi Anda.
                    </p>
                  </div>

                  {/* Item 5 */}
                  <div className="py-6 lg:py-8 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          05 &bull; FINAL REVIEW & ACTION PLAN
                        </span>
                        <h3 className="font-bold text-[#071A33] text-2xl sm:text-3xl">Final Review & Action Plan</h3>
                      </div>
                      <Target className="h-10 w-10 text-[#C79A3C] shrink-0 stroke-[1.7]" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1">
                      Peninjauan akhir di hari ke-90 untuk merangkum perjalanan dan menyusun rencana aksi lanjutan setelah program selesai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── UNTUK SIAPA PROGRAM INI ─── */}
        <section id="sasaran" className="relative py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-[#EAE5D9] overflow-hidden bg-[#FAF8F4]">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
            <img
              src="/bg-6.webp"
              alt="Background Section 6"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold text-[#071A33] tracking-tight">
                Program Ini Untuk Anda
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-xl mx-auto font-medium">
                Dirancang untuk mereka yang ingin membawa dampak spiritual ke ranah profesional dan personal.
              </p>
            </div>

            {/* 3x2 Grid Glossy Translucent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <UserCheck className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Leader &amp; Executive
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Pemimpin yang ingin mengembangkan kepemimpinan berlandaskan nilai dan makna.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <FileText className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Entrepreneur &amp; Business Owner
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Pengusaha dan pemilik bisnis yang ingin tumbuh berkelanjutan dan berdampak.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <Users className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Profesional Muda &amp; Senior
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Profesional yang ingin terus berkembang dan memberi kontribusi lebih besar.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <GraduationCap className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Pendidik &amp; Akademisi
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Pendidik dan akademisi yang ingin menginspirasi dan mentransformasi.
                  </p>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <Users className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Pemimpin Komunitas
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Pemimpin komunitas yang ingin membawa perubahan nyata.
                  </p>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(11,44,107,0.06)] rounded-3xl p-8 text-center flex flex-col items-center justify-between hover:bg-white/30 hover:border-white/60 transition-all duration-300">
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-[#C79A3C]/10 border border-[#C79A3C]/20 flex items-center justify-center text-[#C79A3C] shadow-sm mb-4">
                    <Clock className="h-7 w-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#071A33] text-xl sm:text-2xl leading-tight mb-2">
                    Siapa pun yang Ingin Bertumbuh
                  </h3>
                  <div className="w-8 h-[2px] bg-[#C79A3C]/40 mx-auto my-2" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
                    Siapa pun yang memiliki keinginan tulus untuk bertumbuh dan memberi manfaat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ SECTION (Layout persis Section 3: Split 25% Left Title Header, 75% Right Accordions) ─── */}
        <section id="faq" className="py-20 md:py-28 px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative border-t border-[#EAE5D9] w-full">
          <div className="w-full pl-2 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column (25% / 3 cols) - Sticky Title Header */}
              <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-28">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#071A33] tracking-tight leading-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                  Temukan jawaban atas pertanyaan umum seputar program pendampingan Spiritual Leadership Journey (SLJ).
                </p>
              </div>

              {/* Right Column (75% / 9 cols) - 2-Column Accordion Cards Grid */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-[#EAE5D9] rounded-xl overflow-hidden bg-white shadow-2xs hover:border-[#C79A3C]/50 transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-[#071A33] text-sm sm:text-base gap-4 hover:bg-[#FAF8F4]/80 transition-colors"
                      >
                        <span className="leading-snug">{faq.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-[#C79A3C] shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {openFaq === idx && (
                        <div className="p-5 pt-0 text-sm text-gray-600 leading-relaxed font-normal border-t border-[#EAE5D9]/50 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER (With cta_bg.webp background + White Overlay) ─── */}
        <section id="kontak" className="relative py-24 px-6 text-[#071A33] border-t border-[#EAE5D9] overflow-hidden bg-[#E7E7E4]">
          {/* Background Image Layer dengan Overlay Putih */}
          <div className="absolute inset-0 z-0">
            <img
              src="/cta_bg.webp"
              alt="CTA Background"
              className="w-full h-full object-cover object-center"
            />
            {/* White Overlay tipis (opacity 15%) */}
            <div className="absolute inset-0 bg-white/15" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light leading-[1.08] tracking-[-0.03em] text-[#071A33]">
              Siap Memulai Perjalanan <br />
              Transformasi 90 Hari Anda?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#071A33]/85 max-w-2xl mx-auto font-normal leading-relaxed">
              Daftarkan diri Anda atau konsultasikan program Spiritual Leadership Journey bersama tim BinaHub.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                <button className="bg-[#0B2C6B] hover:bg-[#071A33] text-white text-xs sm:text-sm font-bold uppercase tracking-[0.18em] px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2">
                  {isLoggedIn ? "Ke Dashboard" : "Daftar Sekarang"} <ArrowRight className="h-4 w-4 text-[#C79A3C]" />
                </button>
              </Link>
              <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                <button className="border border-black/10 bg-white/90 text-[#0B2C6B] hover:border-[#0B2C6B]/24 hover:bg-white text-xs sm:text-sm font-bold uppercase tracking-[0.16em] px-7 py-3.5 rounded-full shadow-xs transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2">
                  Konsultasi Program <ChevronRight className="h-4 w-4" />
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER (Style website-prod Full Width) ─── */}
      <footer className="relative overflow-hidden border-t border-black/[0.06] bg-[#FAF8F4] px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-6 md:pb-8 text-[#0B2C6B] w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 pb-10 border-b border-[#0B2C6B]/10">
            {/* Col 1: Brand & Tagline */}
            <div className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-block">
                <img
                  src="/binahub_logo.webp"
                  alt="BinaHub Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="text-sm font-light leading-[1.75] text-[#0B2C6B]/70 max-w-sm">
                Transformasi manusia, kepemimpinan, dan kapabilitas untuk masa depan yang terus berubah.
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C79A3C]">
                People. Learning. Elevated.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://binahub.id"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Website BinaHub"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0B2C6B] text-[#0B2C6B] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/binahub.id"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0B2C6B] text-[#0B2C6B] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.4" /><path d="M16.8 7.2h.01" /></svg>
                </a>
                <a
                  href="https://tiktok.com/@binahub.id"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0B2C6B] text-[#0B2C6B] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15.4 3.5c.3 2.2 1.6 3.8 3.8 4.2v3.1a7.2 7.2 0 0 1-3.7-1.2v5.9c0 3-2.2 5.1-5.2 5.1-2.8 0-5-2-5-4.8 0-3.2 2.8-5.3 6.1-4.7v3.2c-1.4-.4-2.8.3-2.8 1.6 0 1 .8 1.7 1.8 1.7 1.1 0 1.8-.7 1.8-2V3.5h3.2Z" /></svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/binahubid/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0B2C6B] text-[#0B2C6B] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5.1 8.8h3.3v10.6H5.1V8.8Zm1.7-5.2c1.1 0 1.9.8 1.9 1.8 0 1.1-.8 1.9-1.9 1.9S4.9 6.5 4.9 5.4c0-1 .8-1.8 1.9-1.8Zm3.7 5.2h3.1v1.4h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5v5.9h-3.3v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.3h-3.3V8.8Z" /></svg>
                </a>
                <a
                  href="https://youtube.com/@binahubid"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0B2C6B] text-[#0B2C6B] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4a3 3 0 0 0-2.1 2.1A31 31 0 0 0 0 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.5zM9.75 15.02V8.48L15.5 12l-5.75 3.02z" /></svg>
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Groups */}
            <div className="lg:col-span-5">
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0B2C6B]/40">
                NAVIGASI PROGRAM
              </h4>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6B]">
                    Spiritual Leadership Journey
                  </span>
                  <ul className="space-y-3 pt-2">
                    <li><a href="#tentang" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Tentang Program</a></li>
                    <li><a href="#tahapan" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">4 Tahapan Transformasi</a></li>
                    <li><a href="#manfaat" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Manfaat & Ekosistem</a></li>
                    <li><a href="#sasaran" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Untuk Siapa</a></li>
                    <li><a href="#faq" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Pertanyaan Umum (FAQ)</a></li>
                  </ul>
                </div>
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6B]">
                    Ekosistem BinaHub
                  </span>
                  <ul className="space-y-3 pt-2">
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Tentang BinaHub</a></li>
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Artikel & Perspektif</a></li>
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">Karir</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Col 3: Contact Info */}
            <div className="lg:col-span-3">
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0B2C6B]/40">
                HUBUNGI KAMI
              </h4>
              <div className="space-y-5 text-sm">
                <div className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C]/10 text-[#C79A3C]">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0B2C6B]/40">Kantor</span>
                    <p className="text-sm font-light leading-[1.6] text-[#0B2C6B]/70">
                      Kencana Tower, Level Mezzanine, Jl. Raya Meruya Ilir No. 88<br />
                      Business Park Kebon Jeruk, Jakarta Barat 11620
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C]/10 text-[#C79A3C]">
                    <Mail size={17} />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0B2C6B]/40">Email</span>
                    <a href="mailto:info@binahub.id" className="font-medium text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">
                      info@binahub.id
                    </a>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C]/10 text-[#C79A3C]">
                    <Phone size={17} />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0B2C6B]/40">Telepon</span>
                    <a href="tel:02129601514" className="font-medium text-[#0B2C6B]/70 hover:text-[#C79A3C] transition-colors">
                      021-29601514
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row text-xs text-[#0B2C6B]/50">
            <div>
              &copy; {new Date().getFullYear()}{" "}
              <span className="font-bold text-[#0B2C6B]">
                Bina<span className="text-[#C79A3C]">Hub</span>
              </span>
              . PT Binahub Solusi Transformasi.
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="font-semibold uppercase tracking-widest hover:text-[#C79A3C] transition-colors text-[10px]">
                Kebijakan Privasi
              </Link>
              <Link href="#" className="font-semibold uppercase tracking-widest hover:text-[#C79A3C] transition-colors text-[10px]">
                Syarat & Ketentuan
              </Link>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0B2C6B]/30">
              People. Learning. Elevated.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
