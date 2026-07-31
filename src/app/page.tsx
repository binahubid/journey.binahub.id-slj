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
  Sparkles,
  Shield,
  Zap,
  Check,
  X,
  Briefcase,
  Building2,
  HelpCircle,
  AlertCircle,
  BarChart3,
  Flame,
} from "lucide-react";
import { MotivationDeclineChart } from "@/components/domain/MotivationDeclineChart";

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
      question: "Apakah program ini hanya untuk level eksekutif/manajer?",
      answer:
        "Program dirancang khusus untuk berbagai jenjang kepemimpinan di organisasi, mulai dari Executive dan Senior Leaders, Manager dan Supervisor, hingga High Performing Employees dan Future Leaders yang sedang disiapkan naik jenjang. Entrepreneurs dan Professionals juga bisa bergabung lewat perusahaan/mitra penyelenggara yang mendaftarkan mereka.",
    },
    {
      question: "Apa itu Spiritual Leadership Journey (SLJ)?",
      answer:
        "SLJ adalah program pendampingan 90 hari dari BinaJourney dan mitranya yang mengubah pengalaman Umrah menjadi perjalanan transformasi yang berkelanjutan melalui empat tahap: Muhasabah, Niyyah, Mujahadah, dan Istiqamah didampingi coach, Sahabat Safar, dan platform digital untuk mencatat progres harian.",
    },
    {
      question: "Mengapa pendampingan berlangsung selama 90 hari?",
      answer:
        "90 hari bukan angka acak. Riset habit formation dari University College London (Lally et al., 2010) menemukan rata-rata 66 hari dibutuhkan untuk sebuah kebiasaan baru menjadi otomatis (dengan rentang 18 hingga 254 hari). Kami memilih 90 hari sebagai durasi yang diharapkan cukup untuk mengakomodasi variasi tersebut, sekaligus cukup terstruktur untuk tetap fokus. Program dibagi ke tiga checkpoint bulanan (Hari 30, 60, 90) agar perubahan berjalan bertahap dan terukur.",
    },
    {
      question: "Apakah saya akan didampingi oleh coach?",
      answer:
        "Ya, akan ada sesi-sesi khusus bersama Coach selama program berlangsung.",
    },
    {
      question: "Bagaimana jika saya tertinggal atau melewatkan beberapa hari?",
      answer:
        "Tidak masalah, SLJ dirancang tanpa rasa bersalah saat ada hari yang terlewat. Sistem hanya menandai untuk membantu Anda dan coach tahu kapan perlu perhatian lebih, bukan untuk menghakimi. Anda bisa melanjutkan kapan saja.",
    },
    {
      question: "Apakah saya harus membuka aplikasi setiap hari?",
      answer:
        "Tidak wajib, tapi disarankan, mengisi habit harian dan jurnal singkat membantu Anda tetap terhubung dengan niat awal. Coach dan Sahabat Safar juga akan menghubungi Anda jika progres perlu didampingi lebih intensif.",
    },
    {
      question: "Mengapa perubahan sering tidak bertahan setelah umrah?",
      answer:
        "Karena semangat spiritual yang muncul di Tanah Suci sering tidak punya struktur pendampingan saat kembali ke rutinitas. SLJ hadir mengisi celah itu lewat rencana aksi tertulis (PTP), Coach, dan Sahabat Safar yang saling menjaga selama total 90 hari.",
    },
    {
      question: "Apakah SLJ hanya untuk jamaah umrah?",
      answer:
        "Ya, saat ini program SLJ menggunakan moment perjalanan umrah untuk membantu proses transformasi diri",
    },
    {
      question: "Apa itu Kode Program dan dari mana saya mendapatkannya?",
      answer:
        "Kode Program adalah kode unik yang menghubungkan akun Anda ke program SLJ di batch keberangkatan tertentu. Kode ini diberikan oleh BinaHub kepada perusahaan, komunitas, atau mitra penyelenggara yang mendaftarkan Anda. Setelah membuat akun, masukkan Kode Program ini untuk mengaktifkan akses ke program",
    },
    {
      question: "Apa yang akan saya lakukan selama 90 hari?",
      answer:
        "Empat tahap: Muhasabah (mengenali diri sebelum berangkat), Niyyah (meluruskan arah dan menyusun Personal Transformation Project menjelang berangkat), Mujahadah (menjalani ibadah dan perubahan bermakna di Madinah & Makkah), dan Istiqamah (menjaga perubahan jadi kebiasaan setelah pulang ke rumah), semuanya didampingi coach dan tercatat di platform digital kami.",
    },
    {
      question: "Apakah saya bisa mengubah Personal Transformation Project (PTP)?",
      answer:
        "PTP adalah komitmen yang Anda tulis sendiri di awal perjalanan, jadi perubahannya memang bisa diajukan, misalnya jika target awal ternyata kurang realistis, tapi melalui persetujuan coach, supaya PTP tetap menjadi kontrak perubahan yang serius, bukan berubah sepihak.",
    },
    {
      question: "Bagaimana progres saya diukur?",
      answer:
        "Melalui checkpoint dan platform digital binahub.",
    },
    {
      question: "Bagaimana cara bergabung?",
      answer:
        "Buat akun, lalu masukkan Kode Program yang diberikan oleh perusahaan atau mitra penyelenggara yang mendaftarkan Anda untuk mengaktifkan akses. Belum punya Kode Program? Hubungi tim BinaHub untuk konsultasi program dan pendaftaran perusahaan/kelompok Anda terlebih dahulu.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0F1E3D] flex flex-col font-sans selection:bg-[#C79A3C]/20">
      {/* ─── HEADER / NAVBAR (FIXED TOP) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-md transition-all border-b border-[#0F1E3D]/10">
        <div className="w-full px-6 md:px-12 lg:px-16 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link href="/" className="inline-block group py-1">
              <img
                src="/BinaJourney_logo.webp"
                alt="BinaJourney Logo"
                className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* Strategic Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10 text-xs sm:text-sm font-medium text-slate-600">
            <a href="#why-slj" className="hover:text-[#0F1E3D] transition-colors">
              Why SLJ
            </a>
            <a href="#tahapan" className="hover:text-[#0F1E3D] transition-colors">
              4 Tahapan
            </a>
            <a href="#ekosistem" className="hover:text-[#0F1E3D] transition-colors">
              Ekosistem
            </a>
            <a href="#sasaran" className="hover:text-[#0F1E3D] transition-colors">
              Untuk Siapa
            </a>
            <a href="#faq" className="hover:text-[#0F1E3D] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <button className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0F1E3D] hover:bg-[#07132B] text-white text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] px-6 py-2.5 shadow-[0_18px_42px_-20px_rgba(15,30,61,0.8)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95">
                {isLoggedIn ? "Dashboard" : "Mulai Journey"}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 sm:pt-24">
        {/* ─── 1. HERO SECTION ─── */}
        <section id="tentang" className="pt-6 sm:pt-10 pb-0 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative w-full overflow-hidden">
          {/* Hanging Ribbon Badge (Top-Center on mobile, Top-Right on desktop) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 md:left-auto md:right-12 lg:right-16 md:translate-x-0 z-20 pointer-events-none">
            <div className="bg-[#0F1E3D] text-[#C79A3C] border-x-2 border-b-2 border-[#C79A3C] shadow-xl rounded-b-2xl px-4 py-2.5 sm:px-6 sm:py-3.5 flex flex-col items-center justify-center text-center shrink-0">
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#C79A3C]">
                EXECUTIVE UMRAH-BASED
              </span>
              <span className="text-sm sm:text-xl font-extrabold text-[#C79A3C] leading-none my-0.5 sm:my-1 tracking-tight font-serif">
                TRANSFORMATION
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#C79A3C]/90">
                PROGRAM 90 HARI
              </span>
            </div>
          </div>

          <div className="w-full text-left space-y-8">
            {/* Inset Text Block (pt-20 on mobile to fit top ribbon, pt-8 on desktop) */}
            <div className="pl-0 sm:pl-8 md:pl-12 lg:pl-16 pt-20 md:pt-8 max-w-4xl space-y-4 sm:space-y-5">
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[clamp(2.5rem,4.5vw,4.5rem)] font-bold leading-[1.15] sm:leading-[1.1] tracking-[-0.035em] text-[#0F1E3D] max-w-5xl pt-2">
                Spiritual Leadership{" "}
                <span className="relative inline-block px-1">
                  <span className="relative z-10">Journey</span>
                  <span className="absolute bottom-1 left-0 right-0 h-[48%] bg-[#C79A3C]/35 rounded-xs -z-0" aria-hidden="true" />
                </span>
              </h1>

              {/* Tagline baru (italic, gold — dari flyer) */}
              <p className="text-lg sm:text-2xl font-serif italic text-[#C79A3C] tracking-wide pt-1">
                &ldquo;Leadership Beyond the Limit&rdquo;
              </p>

              {/* Body Copy Baru */}
              <div className="space-y-3 max-w-3xl pt-1 text-[#30405C] text-sm sm:text-base md:text-lg leading-[1.6] sm:leading-[1.65] font-normal">
                <p className="font-semibold text-[#0F1E3D]">
                  Umrah bukan akhir perjalanan spiritual. Ia adalah awal transformasi hidup.
                </p>
                <p>
                  Banyak orang pulang dari Umrah dengan hati yang tenang. Namun hanya sedikit yang berhasil mempertahankan perubahan itu ketika kembali pada rutinitas.
                </p>
                <p className="text-slate-600 text-xs sm:text-base">
                  Spiritual Leadership Journey adalah program pendampingan transformasi 90 hari yang membantu pengalaman Umrah menjadi perubahan nyata, berkelanjutan, dan berdampak pada kehidupan pribadi, keluarga, pekerjaan, serta kepemimpinan Anda.
                </p>
              </div>

              {/* CTAs */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                  <button className="inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-[9px] bg-[#0F1E3D] px-6 sm:px-7 text-[10px] md:text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_22px_56px_-30px_rgba(15,30,61,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#07132B] active:scale-95 w-full sm:w-auto">
                    {isLoggedIn ? "Ke Dashboard" : "Mulai Journey"} <ArrowRight className="h-4 w-4 text-[#C79A3C]" />
                  </button>
                </Link>
                <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                  <button className="inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-[9px] border border-[#0F1E3D]/20 bg-white/80 px-6 sm:px-7 text-[10px] md:text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#0F1E3D] shadow-[0_18px_54px_-38px_rgba(15,30,61,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F1E3D]/40 hover:bg-white w-full sm:w-auto">
                    Jadwalkan Discovery Session <ChevronRight className="h-4 w-4 text-[#C79A3C]" />
                  </button>
                </a>
              </div>
            </div>

            {/* Hero Image Banner */}
            <div className="w-full overflow-hidden rounded-t-[20px] sm:rounded-t-[36px] rounded-b-none border-t border-x border-slate-200/60 shadow-lg bg-white mt-6 sm:mt-8">
              <img
                src="/hero.webp"
                alt="Jamaah di depan Ka'bah"
                className="w-full h-[240px] sm:h-[440px] md:h-[540px] lg:h-[620px] object-cover object-[center_35%]"
                loading="eager"
              />
            </div>
          </div>
        </section>
        {/* ─── 2. MASALAH YANG KAMI PECAHKAN ─── */}
        <section id="masalah" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#FAF8F4] border-t border-[#EAE5D9]">
          <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
            {/* 2.1 Side-by-Side: Teks Judul di Kiri (5 cols) & Grafik di Kanan (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
              {/* Teks Judul (Kiri / 5 Columns) */}
              <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  TANTANGAN PASCA-UMRAH
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3D] tracking-tight leading-tight">
                  Setelah Umrah...
                </h2>
                <p className="text-sm sm:text-lg text-slate-700 font-medium leading-relaxed">
                  Semangat itu nyata. Tapi kenapa sering memudar?
                </p>
              </div>

              {/* Grafik Penurunan Semangat (Kanan / 7 Columns) */}
              <div className="lg:col-span-7 w-full">
                <MotivationDeclineChart />
              </div>
            </div>

            {/* 2.3 4 Penyebab Utama Penurunan Semangat (Di Bawah Grafik) */}
            <div className="space-y-5 sm:space-y-6 pt-2">
              <h3 className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] border-b border-[#C79A3C]/20 pb-3">
                4 Penyebab Utama Penurunan Semangat
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-b border-[#C79A3C]/20 pb-6">
                {/* 01 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#C79A3C] font-serif block">01</span>
                  <h4 className="font-bold text-[#0F1E3D] text-sm sm:text-base">Spirit Menurun</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Pada dasarnya iman naik dan turun tergantung kondisi diri dan lingkungan.
                  </p>
                </div>

                {/* 02 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#C79A3C] font-serif block">02</span>
                  <h4 className="font-bold text-[#0F1E3D] text-sm sm:text-base">Target Perubahan Kurang Jelas</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Niat tanpa rencana berubah menjadi harapan yang perlahan terlupakan.
                  </p>
                </div>

                {/* 03 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#C79A3C] font-serif block">03</span>
                  <h4 className="font-bold text-[#0F1E3D] text-sm sm:text-base">Kesibukan Mengambil Alih</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Meeting, deadline, semua rutinitas harian kembali menyita waktu sebelum kebiasaan baru terbentuk.
                  </p>
                </div>

                {/* 04 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#C79A3C] font-serif block">04</span>
                  <h4 className="font-bold text-[#0F1E3D] text-sm sm:text-base">Tidak Ada Akuntabilitas</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Kurangnya pendampingan, mitra, dan komunitas yang saling mengingatkan ketika semangat mulai turun. Sistem yang menunjang perubahan diri juga biasanya kurang optimal untuk sebelum, saat, dan pasca kepulangan.<sup className="text-[#C79A3C]">1</sup>
                  </p>
                  <p className="text-[10px] text-slate-400 italic pt-1.5 leading-tight">
                    <sup>1</sup> Riset: Pembinaan Pasca Ibadah Haji Menuju Mabrur Sepanjang Hayat (2019, ResearchGate / Kajian Akademik Indonesia)
                  </p>
                </div>
              </div>
            </div>

            {/* 2.4 Pull Quote Card (Bridge) & CTA */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0F1E3D] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-xl sm:text-3xl font-serif text-[#C79A3C] font-semibold leading-tight">
                  &ldquo;Kami Tidak Mengubah Orang.&rdquo;
                </h4>
                <p className="text-sm sm:text-lg text-slate-200 leading-relaxed font-normal">
                  Kami membantu proses transformasi diri untuk menjadi versi pribadi yang lebih baik.
                </p>
                <p className="text-xs sm:text-sm font-semibold italic text-[#C79A3C] pt-1">
                  Karena itu, kami membangun Spiritual Leadership Journey.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                  <button className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#C79A3C] hover:bg-[#b08732] text-[#0F1E3D] text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.14em] px-6 sm:px-7 py-3 sm:py-3.5 shadow-md transition-all w-full sm:w-auto">
                    Jadwalkan Discovery Session <ChevronRight className="h-4 w-4 text-[#0F1E3D]" />
                  </button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. WHY THIS PROGRAM? ─── */}
        <section id="why-slj" className="py-14 sm:py-20 md:py-24 px-5 sm:px-6 md:px-12 lg:px-16 bg-white border-t border-[#EAE5D9]">
          <div className="max-w-6xl mx-auto pl-0 sm:pl-8 md:pl-12 lg:pl-16 space-y-6 sm:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                MEMPERKUAT KARAKTER KEPEMIMPINAN
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0F1E3D] tracking-tight">
                Why This Program?
              </h2>
            </div>

            <div className="space-y-5 sm:space-y-6 text-slate-700 text-sm sm:text-lg leading-relaxed font-normal">
              <p className="text-lg sm:text-2xl font-serif text-[#0F1E3D] leading-snug">
                Dunia kerja menuntut hasil. Namun kepemimpinan yang berkelanjutan membutuhkan sesuatu yang lebih dalam.
              </p>

              <p>
                Banyak pemimpin berhasil mencapai target bisnis yang terus meningkat, tetapi menghadapi tantangan dalam menjaga keseimbangan kehidupan, kemampuan mengelola berbagai tekanan, ketenangan batin, dan pemahaman yang dalam atas makna amanah yang diemban.
              </p>

              {/* Card Solid (Tanpa Aksen Border Kiri) */}
              <div className="p-5 sm:p-8 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] shadow-xs space-y-2">
                <p className="font-bold text-[#0F1E3D] text-base sm:text-xl leading-relaxed">
                  Spiritual Leadership Journey membantu peserta memperkuat karakter kepemimpinan melalui perjalanan spiritual yang terarah, terukur, dan berdampak.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                <button className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0F1E3D] hover:bg-[#07132B] text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.16em] px-6 sm:px-7 py-3 sm:py-3.5 shadow-md transition-all w-full sm:w-auto">
                  Jadwalkan Discovery Session <ChevronRight className="h-4 w-4 text-[#C79A3C]" />
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* ─── 4. FILOSOFI PROGRAM (QUOTE BLOCK WITH BG-FILOSOFI.WEBP) ─── */}
        <section className="py-14 sm:py-20 md:py-24 px-5 sm:px-6 bg-[#0F1E3D] text-white relative overflow-hidden">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <img
              src="/bg-filosofi.webp"
              alt="Filosofi Background"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 relative z-10">
            <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.3em] block">
              FILOSOFI PROGRAM
            </span>
            <span className="text-4xl sm:text-6xl font-serif text-[#C79A3C] block leading-none">&ldquo;</span>
            <blockquote className="text-lg sm:text-2xl md:text-4xl font-serif italic leading-snug sm:leading-relaxed text-white max-w-3xl mx-auto -mt-2 sm:-mt-6">
              Perjalanan ke Baitullah mengubah cara kita memandang kehidupan. Istiqamah menentukan bagaimana kita menjalaninya.
            </blockquote>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#C79A3C] font-extrabold pt-2 block">
              BINAJOURNEY
            </p>
          </div>
        </section>

        {/* ─── 5. FRAMEWORK — EMPAT TAHAPAN ─── */}
        <section id="tahapan" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative border-b border-[#EAE5D9] w-full overflow-hidden">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <img
              src="/bg-3.webp"
              alt="Background Section 3"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 w-full pl-0 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              {/* Left Column (25% / 3 cols) - Title Header */}
              <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:sticky lg:top-28">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  ROADMAP TRANSFORMASI
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3D] tracking-tight leading-tight">
                  Empat Tahapan Transformasi Spiritual
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
                  Proses bertahap yang mengubah niat mendalam menjadi kebiasaan hidup berkelanjutan.
                </p>
              </div>

              {/* Right Column (75% / 9 cols) - 2x2 Grid Layout */}
              <div className="lg:col-span-9">
                {/* Desktop & Tablet: 2x2 Grid Layout */}
                <div className="hidden md:grid md:grid-cols-2 border-b border-[#C79A3C]/20 pb-4">
                  {/* Row 1, Col 1 - Muhasabah */}
                  <div className="p-6 lg:p-8 space-y-4 border-b md:border-r border-[#C79A3C]/20 pr-6 lg:pr-10 bg-white/60 rounded-tl-2xl backdrop-blur-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          01 &bull; SEBELUM KEBERANGKATAN
                        </span>
                        <h3 className="font-bold text-[#0F1E3D] text-2xl sm:text-3xl">Muhasabah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider italic">Discover Yourself</p>
                      </div>
                      <img
                        src="/icons/stage_01_muhasabah.png"
                        alt="Muhasabah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    {/* Deskripsi (Tujuan) — Preserved */}
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      Menyadari kondisi diri secara jujur dan mendalam sebagai titik awal perubahan.
                    </p>
                    {/* Bullet Aktivitas — Enrichment dari Flyer */}
                    <div className="pt-2 border-t border-[#C79A3C]/20 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-2">
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Baseline Self Discovery</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Refleksi Diri</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Ukhuwah</span>
                    </div>
                  </div>

                  {/* Row 1, Col 2 - Niyyah */}
                  <div className="p-6 lg:p-8 space-y-4 border-b border-[#C79A3C]/20 pl-6 lg:pl-10 bg-white/60 rounded-tr-2xl backdrop-blur-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          02 &bull; MENJELANG KEBERANGKATAN
                        </span>
                        <h3 className="font-bold text-[#0F1E3D] text-2xl sm:text-3xl">Niyyah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider italic">Align Your Purpose</p>
                      </div>
                      <img
                        src="/icons/stage_02_niyyah.png"
                        alt="Niyyah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    {/* Deskripsi (Tujuan) — Preserved */}
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      Menemukan alasan dan tujuan hidup yang lurus karena Allah, lalu merencanakan perubahan yang jelas.
                    </p>
                    {/* Bullet Aktivitas — Enrichment dari Flyer */}
                    <div className="pt-2 border-t border-[#C79A3C]/20 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-2">
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Meluruskan Tujuan</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Amanah Kehidupan</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Perencanaan Transformasi</span>
                    </div>
                  </div>

                  {/* Row 2, Col 1 - Mujahadah */}
                  <div className="p-6 lg:p-8 space-y-4 md:border-r border-[#C79A3C]/20 pr-6 lg:pr-10 bg-white/60 rounded-bl-2xl backdrop-blur-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          03 &bull; DI MADINAH & MAKKAH
                        </span>
                        <h3 className="font-bold text-[#0F1E3D] text-2xl sm:text-3xl">Mujahadah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider italic">Experience the Transformation</p>
                      </div>
                      <img
                        src="/icons/stage_03_mujahadah.png"
                        alt="Mujahadah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    {/* Deskripsi (Tujuan) — Preserved */}
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      Mengalami ibadah Umrah secara bermakna, memperdalam hubungan dengan Allah, dan memperjuangkan perubahan diri.
                    </p>
                    {/* Bullet Aktivitas — Enrichment dari Flyer */}
                    <div className="pt-2 border-t border-[#C79A3C]/20 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-2">
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Meaningful Umrah</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Reflection</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Coaching</span>
                    </div>
                  </div>

                  {/* Row 2, Col 2 - Istiqamah */}
                  <div className="p-6 lg:p-8 space-y-4 pl-6 lg:pl-10 bg-white/60 rounded-br-2xl backdrop-blur-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C79A3C] tracking-widest uppercase block">
                          04 &bull; SETELAH PULANG KE RUMAH
                        </span>
                        <h3 className="font-bold text-[#0F1E3D] text-2xl sm:text-3xl">Istiqamah</h3>
                        <p className="text-xs font-bold text-[#C79A3C] uppercase tracking-wider italic">Sustain the Change</p>
                      </div>
                      <img
                        src="/icons/stage_04_istiqamah.png"
                        alt="Istiqamah Icon"
                        className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
                      />
                    </div>
                    {/* Deskripsi (Tujuan) — Preserved */}
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      Mengimplementasikan perubahan dalam kehidupan sehari-hari secara konsisten dan berkelanjutan.
                    </p>
                    {/* Bullet Aktivitas — Enrichment dari Flyer */}
                    <div className="pt-2 border-t border-[#C79A3C]/20 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-2">
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Habit Building</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Project Implementation</span>
                      <span className="bg-[#FAF8F4] px-2.5 py-1 rounded border border-[#C79A3C]/30">Coaching</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Vertical Timeline (Sesuai Spesifikasi COMPONENT_INVENTORY.md) */}
                <div className="block md:hidden border-l-2 border-[#C79A3C]/40 pl-5 ml-2 space-y-8 relative">
                  {/* Stage 1 */}
                  <div className="relative space-y-1.5 pt-0.5">
                    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-[#C79A3C] border-2 border-[#FAF8F4]" />
                    <span className="text-[10px] font-extrabold text-[#C79A3C] tracking-widest uppercase block">
                      01 &bull; SEBELUM KEBERANGKATAN
                    </span>
                    <h3 className="font-bold text-[#0F1E3D] text-lg leading-tight">
                      Muhasabah <span className="text-xs font-semibold text-[#C79A3C] italic block sm:inline">&bull; Discover Yourself</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-0.5">
                      Menyadari kondisi diri secara jujur dan mendalam sebagai titik awal perubahan.
                    </p>
                    <div className="pt-2 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-1.5">
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Baseline Self Discovery</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Refleksi Diri</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Ukhuwah</span>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="relative space-y-1.5 pt-0.5">
                    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-[#C79A3C] border-2 border-[#FAF8F4]" />
                    <span className="text-[10px] font-extrabold text-[#C79A3C] tracking-widest uppercase block">
                      02 &bull; MENJELANG KEBERANGKATAN
                    </span>
                    <h3 className="font-bold text-[#0F1E3D] text-lg leading-tight">
                      Niyyah <span className="text-xs font-semibold text-[#C79A3C] italic block sm:inline">&bull; Align Your Purpose</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-0.5">
                      Menemukan alasan dan tujuan hidup yang lurus karena Allah, lalu merencanakan perubahan yang jelas.
                    </p>
                    <div className="pt-2 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-1.5">
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Meluruskan Tujuan</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Amanah Kehidupan</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Perencanaan Transformasi</span>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="relative space-y-1.5 pt-0.5">
                    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-[#C79A3C] border-2 border-[#FAF8F4]" />
                    <span className="text-[10px] font-extrabold text-[#C79A3C] tracking-widest uppercase block">
                      03 &bull; DI MADINAH &amp; MAKKAH
                    </span>
                    <h3 className="font-bold text-[#0F1E3D] text-lg leading-tight">
                      Mujahadah <span className="text-xs font-semibold text-[#C79A3C] italic block sm:inline">&bull; Experience the Transformation</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-0.5">
                      Mengalami ibadah Umrah secara bermakna, memperdalam hubungan dengan Allah, dan memperjuangkan perubahan diri.
                    </p>
                    <div className="pt-2 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-1.5">
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Meaningful Umrah</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Reflection</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Coaching</span>
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div className="relative space-y-1.5 pt-0.5">
                    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-[#C79A3C] border-2 border-[#FAF8F4]" />
                    <span className="text-[10px] font-extrabold text-[#C79A3C] tracking-widest uppercase block">
                      04 &bull; SETELAH PULANG KE RUMAH
                    </span>
                    <h3 className="font-bold text-[#0F1E3D] text-lg leading-tight">
                      Istiqamah <span className="text-xs font-semibold text-[#C79A3C] italic block sm:inline">&bull; Sustain the Change</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-0.5">
                      Mengimplementasikan perubahan dalam kehidupan sehari-hari secara konsisten dan berkelanjutan.
                    </p>
                    <div className="pt-2 text-xs font-semibold text-[#0F1E3D] flex flex-wrap gap-1.5">
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Habit Building</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Project Implementation</span>
                      <span className="bg-white/80 px-2.5 py-1 rounded border border-[#C79A3C]/30 text-[11px]">Coaching</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. MENGAPA BINAJOURNEY BERBEDA? ─── */}
        <section id="perbedaan" className="py-14 sm:py-20 md:py-24 px-5 sm:px-6 md:px-12 lg:px-16 bg-white border-b border-[#EAE5D9]">
          <div className="max-w-5xl mx-auto pl-0 sm:pl-8 md:pl-12 lg:pl-16 space-y-8 sm:space-y-10">
            <div className="text-center md:text-left space-y-2 sm:space-y-3">
              <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                NILAI TAMBAH UTAMA
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0F1E3D] tracking-tight">
                Mengapa BinaJourney Berbeda?
              </h2>
              <p className="text-xs sm:text-base text-slate-600">
                Membandingkan Umrah biasa dengan ekosistem pendampingan transformasi SLJ.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#EAE5D9] shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F4] border-b border-[#EAE5D9]">
                    <th className="p-3.5 sm:p-6 text-xs sm:text-base font-bold text-slate-500 w-1/2">
                      Umrah Konvensional
                    </th>
                    <th className="p-3.5 sm:p-6 text-xs sm:text-base font-bold text-[#0F1E3D] bg-[#C79A3C]/10 border-l border-[#C79A3C]/30 w-1/2">
                      <span className="inline-flex items-center gap-1.5 sm:gap-2">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C79A3C]" /> BinaJourney SLJ
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5D9] text-xs sm:text-base">
                  <tr>
                    <td className="p-3.5 sm:p-6 text-slate-600">Fokus perjalanan</td>
                    <td className="p-3.5 sm:p-6 font-semibold text-[#0F1E3D] bg-[#C79A3C]/5 border-l border-[#C79A3C]/20">
                      Fokus transformasi
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-6 text-slate-600">Berakhir saat pulang</td>
                    <td className="p-3.5 sm:p-6 font-semibold text-[#0F1E3D] bg-[#C79A3C]/5 border-l border-[#C79A3C]/20">
                      Berlanjut saat pulang
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-6 text-slate-600">Fokus ritual ibadah</td>
                    <td className="p-3.5 sm:p-6 font-semibold text-[#0F1E3D] bg-[#C79A3C]/5 border-l border-[#C79A3C]/20">
                      Ritual ibadah + transformasi diri + peningkatan performa/kinerja
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-6 text-slate-600">Itinerary perjalanan</td>
                    <td className="p-3.5 sm:p-6 font-semibold text-[#0F1E3D] bg-[#C79A3C]/5 border-l border-[#C79A3C]/20">
                      Roadmap transformasi 90 hari
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-6 text-slate-600">Tour leader</td>
                    <td className="p-3.5 sm:p-6 font-semibold text-[#0F1E3D] bg-[#C79A3C]/5 border-l border-[#C79A3C]/20">
                      Tour leader + tim dan sistem pengembangan diri
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── 7. EKOSISTEM — PROGRAM HIGHLIGHTS (7 ITEMS) ─── */}
        <section id="ekosistem" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative border-t border-[#EAE5D9]">
          <div className="max-w-6xl mx-auto pl-0 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column (25% / 4 cols) */}
              <div className="lg:col-span-4 space-y-3 sm:space-y-4 lg:sticky lg:top-28">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  PROGRAM HIGHLIGHTS
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3D] tracking-tight leading-tight">
                  Apa yang Anda Dapatkan
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
                  7 Komponen ekosistem pendampingan holistik selama 90 hari untuk mendukung pertumbuhan kepemimpinan Anda.
                </p>
                <div className="pt-2 sm:pt-4">
                  <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                    <button className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#0F1E3D] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-5 sm:px-6 py-3 shadow-md hover:bg-[#07132B] transition-all w-full sm:w-auto">
                      Konsultasi Bersama Tim Kami <ChevronRight className="w-4 h-4 text-[#C79A3C]" />
                    </button>
                  </a>
                </div>
              </div>

              {/* Right Column (75% / 8 cols) - 7 Item Stack */}
              <div className="lg:col-span-8">
                <div className="divide-y divide-[#C79A3C]/20 border-y border-[#C79A3C]/20 bg-white/50 rounded-2xl px-4 sm:px-6">
                  {/* Item 1 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        01 &bull; SELF DISCOVERY
                      </span>
                      <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Baseline Self Discovery</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Memahami kondisi diri sebagai titik awal transformasi.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        02 &bull; COACHING
                      </span>
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Executive Coaching</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Pendampingan personal sebelum, selama, dan setelah Umrah untuk meningkatkan kesadaran, arah, dan kesiapan diri.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        03 &bull; SPIRITUAL EXPERIENCE
                      </span>
                      <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Meaningful Umrah Experience</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Menghidupkan setiap rangkaian ibadah menjadi proses pembelajaran dan refleksi yang bermakna.
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        04 &bull; COMMUNITY
                      </span>
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Ukhuwah Building</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Membangun koneksi jamaah yang positif, saling mendukung, dan memberi inspirasi kebaikan.
                    </p>
                  </div>

                  {/* Item 5 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        05 &bull; ACTION PLAN
                      </span>
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Personal Transformation Project (PTP)</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Merancang dan menjalankan perubahan nyata dalam kehidupan maupun pekerjaan.
                    </p>
                  </div>

                  {/* Item 6 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        06 &bull; HABIT BUILDING
                      </span>
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">90-Day Transformation Journey</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Pendampingan agar perubahan menjadi kebiasaan dan memberi dampak berkelanjutan.
                    </p>
                  </div>

                  {/* Item 7 */}
                  <div className="py-4 sm:py-6 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] sm:text-xs font-bold text-[#C79A3C] tracking-widest uppercase">
                        07 &bull; EVALUASI &amp; DASHBOARD
                      </span>
                      <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[#C79A3C] shrink-0" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-lg sm:text-2xl">Monitoring &amp; Evaluation System</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Monitoring perkembangan peserta secara terstruktur melalui dashboard dan evaluasi berkala yang terus dikembangkan menuju insight berbasis AI.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. KEY BENEFITS (2-COLUMN SPLIT LAYOUT SAMA DENGAN ROADMAP) ─── */}
        <section id="manfaat" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 md:px-12 lg:px-16 bg-white border-t border-[#EAE5D9] w-full overflow-hidden">
          <div className="relative z-10 w-full pl-0 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              {/* Left Column (25% / lg:col-span-3 - Sticky Header) */}
              <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:sticky lg:top-28">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  OUTCOME PROGRAM
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3D] tracking-tight leading-tight">
                  Key Benefits
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
                  Dampak nyata yang insya Allah dirasakan oleh peserta dan organisasi setelah mengikuti 90 hari pendampingan.
                </p>
              </div>

              {/* Right Column (75% / lg:col-span-9 - 6 Grid Items) */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                  {/* Card 1 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Award className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Stronger Leadership Character</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Memperkuat integritas, keteladanan, dan ketahanan emosional dalam memimpin.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Spiritual Awareness</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Meningkatkan kesadaran akan amanah kepemimpinan di hadapan Allah dan sesama.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Target className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Purpose-Driven Leadership</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Memimpin/beyond the limit dengan tujuan yang lebih jelas melampaui target duniawi.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Positive Habits</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Membangun rutinitas ibadah dan kebiasaan kepemimpinan yang istiqamah.
                    </p>
                  </div>

                  {/* Card 5 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Organizational Impact</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Membawa pengaruh positif dan budaya kerja yang berlandaskan nilai spiritual ke dalam tim dan perusahaan, untuk berkontribusi mencapai target-target organisasi.
                    </p>
                  </div>

                  {/* Card 6 */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAE5D9] space-y-2.5 sm:space-y-3 hover:border-[#C79A3C]/80 hover:shadow-md transition-all duration-300 group">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-bold text-[#0F1E3D] text-sm sm:text-xl leading-snug">Sustainable Transformation</h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Mendorong perubahan transformasi diri berkelanjutan secara terukur selama 90 hari dan seterusnya.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. UNIFIED SAINS PEMBENTUKAN KEBIASAAN + QUOTE INLINE SECTION ─── */}
        <section id="durasi" className="py-14 sm:py-20 md:py-24 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#0F1E3D] text-white relative overflow-hidden border-t border-[#C79A3C]/30">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
            <img
              src="/bg-90hari.webp"
              alt="Sains 90 Hari Background"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto pl-0 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Left Side: Quote (40% / lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-3 sm:space-y-4 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-[#C79A3C]/30 pb-6 lg:pb-0 pr-0 lg:pr-8">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  REFLEKSI SPIRITUAL
                </span>
                <span className="text-4xl sm:text-5xl font-serif text-[#C79A3C] block leading-none">&ldquo;</span>
                <blockquote className="text-base sm:text-xl font-serif italic text-[#C79A3C] leading-relaxed -mt-2 sm:-mt-4">
                  Perjalanan paling jauh bukan menuju Makkah, tetapi menuju hati yang kembali kepada Allah.
                </blockquote>
              </div>

              {/* Right Side: Sains Pembentukan Kebiasaan (60% / lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  SAINS PEMBENTUKAN KEBIASAAN
                </span>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Kenapa 90 Hari?
                </h2>
                <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-normal">
                  90 hari bukan angka acak. Riset habit formation dari University College London
                  (Lally et al., 2010) menemukan rata-rata <strong className="text-white">66 hari</strong> dibutuhkan
                  untuk sebuah kebiasaan baru menjadi otomatis, dengan rentang 18 hingga 254 hari
                  tergantung jenis kebiasaan dan individunya.
                </p>
                <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal">
                  Kami memilih 90 hari sebagai durasi yang diharapkan cukup untuk mengakomodasi variasi
                  tersebut, sekaligus cukup terstruktur untuk tetap fokus. Program dibagi ke tiga
                  checkpoint bulanan (Hari 30, 60, 90) agar perubahan berjalan bertahap dan terukur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 10. UNTUK SIAPA PROGRAM INI (8 PERSONA KORPORAT) ─── */}
        <section id="sasaran" className="relative py-16 sm:py-24 md:py-32 px-5 sm:px-6 md:px-12 lg:px-16 border-t border-[#EAE5D9] overflow-hidden bg-[#FAF8F4]">
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
            <div className="text-center space-y-2.5 sm:space-y-3 mb-10 sm:mb-16">
              <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                SASARAN AUDIENS (WHO SHOULD ATTEND)
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0F1E3D] tracking-tight">
                Program Ini Untuk Anda
              </h2>
              <p className="text-xs sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto font-medium">
                Dirancang khusus untuk para leader, profesional, dan para talent yang mendaftar melalui perusahaan/mitra penyelenggara.
              </p>
            </div>

            {/* 8 Grid Persona Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Persona 1 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Executive</h3>
                <p className="text-xs text-slate-600">C-Level &amp; Direksi Perusahaan</p>
              </div>

              {/* Persona 2 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Senior Leaders</h3>
                <p className="text-xs text-slate-600">VP &amp; General Manager</p>
              </div>

              {/* Persona 3 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Manager</h3>
                <p className="text-xs text-slate-600">Head of Department &amp; Manager Unit</p>
              </div>

              {/* Persona 4 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Supervisor</h3>
                <p className="text-xs text-slate-600">Team Lead &amp; Supervisor Operasional</p>
              </div>

              {/* Persona 5 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">High Performing Employees</h3>
                <p className="text-xs text-slate-600">Talent Unggulan Organisasi</p>
              </div>

              {/* Persona 6 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Future Leaders</h3>
                <p className="text-xs text-slate-600">Kandidat Pemimpin Masa Depan</p>
              </div>

              {/* Persona 7 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Entrepreneurs</h3>
                <p className="text-xs text-slate-600">Pemilik Bisnis &amp; Pendiri Usaha</p>
              </div>

              {/* Persona 8 */}
              <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center hover:bg-white hover:border-[#C79A3C]/40 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0F1E3D] text-[#C79A3C] flex items-center justify-center mb-2.5 sm:mb-3">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-[#0F1E3D] text-base sm:text-lg mb-1">Professionals</h3>
                <p className="text-xs text-slate-600">Praktisi &amp; Konsultan Spesialis</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 11. FAQ SECTION ─── */}
        <section id="faq" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 md:px-12 lg:px-16 bg-[#FAF8F4] relative border-t border-[#EAE5D9] w-full">
          <div className="w-full pl-0 sm:pl-8 md:pl-12 lg:pl-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              {/* Left Column (25% / 3 cols) - Sticky Title Header */}
              <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:sticky lg:top-28">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C79A3C] uppercase tracking-[0.25em] block">
                  PERTANYAAN UMUM
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3D] tracking-tight leading-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
                  Temukan jawaban atas pertanyaan umum seputar program pendampingan Spiritual Leadership Journey (SLJ).
                </p>
              </div>

              {/* Right Column (75% / 9 cols) - 2-Column Accordion Cards Grid */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 items-start">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-[#EAE5D9] rounded-xl overflow-hidden bg-white shadow-2xs hover:border-[#C79A3C]/50 transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-3.5 sm:p-5 text-left flex items-center justify-between font-bold text-[#0F1E3D] text-xs sm:text-base gap-3 hover:bg-[#FAF8F4]/80 transition-colors"
                      >
                        <span className="leading-snug">{faq.question}</span>
                        <ChevronDown
                          className={`h-4 w-4 sm:h-5 sm:w-5 text-[#C79A3C] shrink-0 transition-transform duration-300 ${
                            openFaq === idx ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openFaq === idx && (
                        <div className="p-4 pt-0 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal border-t border-[#EAE5D9]/50 pt-3">
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

        {/* ─── 12. CTA BANNER AKHIR ─── */}
        <section id="kontak" className="relative py-16 sm:py-24 px-5 sm:px-6 text-[#0F1E3D] border-t border-[#EAE5D9] overflow-hidden bg-[#E7E7E4]">
          {/* Background Image Layer dengan Overlay Putih */}
          <div className="absolute inset-0 z-0">
            <img
              src="/cta_bg.webp"
              alt="CTA Background"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-white/15" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-serif font-light leading-[1.12] sm:leading-[1.08] tracking-[-0.03em] text-[#0F1E3D]">
              Siap Memulai Perjalanan <br />
              Transformasi 90 Hari Anda?
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-[#0F1E3D]/85 max-w-2xl mx-auto font-normal leading-relaxed">
              Daftarkan diri Anda atau jadwalkan Discovery Session bersama tim BinaJourney.
            </p>
            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                <button className="bg-[#0F1E3D] hover:bg-[#07132B] text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] px-7 py-3.5 sm:px-8 sm:py-4 rounded-full shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center gap-2 w-full sm:w-auto">
                  {isLoggedIn ? "Ke Dashboard" : "Mulai Transformasi Sekarang"} <ArrowRight className="h-4 w-4 text-[#C79A3C]" />
                </button>
              </Link>
              <a href="https://wa.me/628118494545" target="_blank" rel="noopener noreferrer">
                <button className="border border-[#0F1E3D]/20 bg-white/90 text-[#0F1E3D] hover:border-[#0F1E3D]/40 hover:bg-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] px-6 py-3 sm:px-7 sm:py-3.5 rounded-full shadow-xs transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto">
                  Jadwalkan Discovery Session <ChevronRight className="h-4 w-4 text-[#C79A3C]" />
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 13. FOOTER ─── */}
      <footer className="relative overflow-hidden border-t border-black/[0.06] bg-[#FAF8F4] px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-6 md:pb-8 text-[#0F1E3D] w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 pb-10 border-b border-[#0F1E3D]/10">
            {/* Col 1: Brand & Tagline */}
            <div className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-block">
                <img
                  src="/binahub_logo.webp"
                  alt="BinaHub Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="text-sm font-light leading-[1.75] text-[#0F1E3D]/70 max-w-sm">
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
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0F1E3D] text-[#0F1E3D] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/binahub.id"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0F1E3D] text-[#0F1E3D] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/binahubid/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0F1E3D] text-[#0F1E3D] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/@binahubid"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#0F1E3D] text-[#0F1E3D] transition-colors hover:border-[#C79A3C] hover:bg-[#C79A3C] hover:text-white"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Groups */}
            <div className="lg:col-span-5">
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0F1E3D]/40">
                NAVIGASI PROGRAM
              </h4>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1E3D]">
                    Spiritual Leadership Journey
                  </span>
                  <ul className="space-y-3 pt-2">
                    <li><a href="#tentang" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Tentang Program</a></li>
                    <li><a href="#why-slj" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Why SLJ</a></li>
                    <li><a href="#tahapan" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">4 Tahapan Transformasi</a></li>
                    <li><a href="#ekosistem" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Manfaat &amp; Ekosistem</a></li>
                    <li><a href="#sasaran" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Untuk Siapa</a></li>
                    <li><a href="#faq" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Pertanyaan Umum (FAQ)</a></li>
                  </ul>
                </div>
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1E3D]">
                    Ekosistem BinaHub
                  </span>
                  <ul className="space-y-3 pt-2">
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Tentang BinaHub</a></li>
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Artikel &amp; Perspektif</a></li>
                    <li><a href="https://binahub.id" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">Karir</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Col 3: Contact Info */}
            <div className="lg:col-span-3">
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0F1E3D]/40">
                HUBUNGI KAMI
              </h4>
              <div className="space-y-5 text-sm">
                <div className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C]/10 text-[#C79A3C]">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0F1E3D]/40">Kantor</span>
                    <p className="text-sm font-light leading-[1.6] text-[#0F1E3D]/70">
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
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0F1E3D]/40">Email</span>
                    <a href="mailto:info@binahub.id" className="font-medium text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">
                      info@binahub.id
                    </a>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C79A3C]/10 text-[#C79A3C]">
                    <Phone size={17} />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#0F1E3D]/40">Telepon</span>
                    <a href="tel:02129601514" className="font-medium text-[#0F1E3D]/70 hover:text-[#C79A3C] transition-colors">
                      021-29601514
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row text-xs text-[#0F1E3D]/50">
            <div>
              &copy; {new Date().getFullYear()}{" "}
              <span className="font-bold text-[#0F1E3D]">
                Bina<span className="text-[#C79A3C]">Hub</span>
              </span>
              . PT Binahub Solusi Transformasi.
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="font-semibold uppercase tracking-widest hover:text-[#C79A3C] transition-colors text-[10px]">
                Kebijakan Privasi
              </Link>
              <Link href="#" className="font-semibold uppercase tracking-widest hover:text-[#C79A3C] transition-colors text-[10px]">
                Syarat &amp; Ketentuan
              </Link>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F1E3D]/30">
              People. Learning. Elevated.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
