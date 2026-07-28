# PRD — Spiritual Leadership Journey (SLJ)
**Produk dari BinaJourney (bagian dari BinaHub — People. Learning. Elevated.)**

Versi: 1.0 (Draft awal untuk kick-off pengembangan)
Status: Draft — siap direview sebelum development dimulai

---

## 1. Executive Summary

SLJ (Spiritual Leadership Journey) adalah platform digital pendamping program transformasi 90 hari milik BinaJourney, yang menggabungkan pengalaman Umrah dengan proses coaching kepemimpinan spiritual. Platform ini mengubah Personal Transformation Project (PTP) — saat ini masih berupa form cetak/statis — menjadi sebuah *digital contract for change* yang hidup: diisi bertahap lewat onboarding wizard, lalu ditindaklanjuti setiap hari lewat dashboard berbasis habit, jurnal, dan monitoring bulanan.

Berbeda dengan BinaHub AMS (talent management system yang kompleks, banyak role dan workflow approval), SLJ secara sengaja dirancang sebagai **Personal Growth / Habit Operating System** — kompleksitas backend rendah, UX yang tenang dan personal, dan arsitektur yang ringan untuk dipelihara oleh tim kecil. Referensi kualitas produk: Apple Health, Notion, Linear, Headspace, Stoic, Reflect.app — bukan "habit tracker Islami" pada umumnya.

SLJ tahap awal adalah aplikasi web (landing page publik + akun peserta), dengan rencana lanjutan ke aplikasi mobile Android/iOS yang berbagi backend yang sama.

## 2. Product Vision

Menjadi *operating system* untuk pertumbuhan spiritual — tempat satu perjalanan Umrah 90 hari tidak berhenti di Tanah Suci, tetapi berlanjut menjadi kebiasaan, karakter, dan kepemimpinan yang terlihat nyata dalam kehidupan peserta sehari-hari.

## 3. Product Mission

- Mengubah niat dan komitmen peserta (dari form PTP) menjadi rencana aksi yang konkret dan terukur.
- Membuat proses muhasabah, ibadah harian, dan refleksi terasa ringan, tenang, dan konsisten — bukan tugas yang menghakimi.
- Menjembatani peserta dengan coach dan sahabat safar mereka selama 90 hari pendampingan.
- Menjadi fondasi jangka panjang (bukan sekadar proyek MVP) yang bisa berkembang ke aplikasi mobile tanpa menulis ulang logika bisnis.

## 4. Success Metrics

**Engagement**
- % peserta yang menyelesaikan onboarding PTP (wizard) dalam 3 hari pertama pendaftaran.
- Habit completion rate rata-rata per peserta per minggu.
- Retensi mingguan (peserta aktif membuka dashboard minimal 4x/minggu).

**Outcome**
- % peserta yang mengisi Refleksi Akhir di hari ke-90.
- % indikator keberhasilan (dari Target 90 Hari) yang ditandai tercapai saat monitoring bulan ke-3.
- Rasio status "On Track" vs "Need Support" di setiap checkpoint bulanan.

**Operasional**
- Waktu onboarding developer baru ke codebase (target: produktif dalam <3 hari berkat dokumentasi).
- Jumlah bug kritis pasca-rilis per bulan.
- Biaya infrastruktur bulanan (target tetap rendah — Vercel + Supabase tier menengah).

## 5. User Personas

**1. Peserta (Jamaah/Peserta Program)**
Profesional, pemimpin komunitas, entrepreneur, atau pendidik yang baru/akan menjalani program Umrah SLJ. Sibuk, terbiasa pakai smartphone, ingin proses reflektif tapi tidak ingin dibebani UI yang rumit atau terasa menghakimi saat gagal checklist.

**2. Coach**
Pendamping personal peserta. Perlu melihat progres beberapa peserta bimbingannya, memberi catatan/dukungan, dan tahu siapa yang "Need Support" tanpa harus membaca laporan panjang.

**3. Admin BinaJourney**
Mengelola pendaftaran program, penugasan coach, dan memonitor kesehatan program secara keseluruhan (tanpa terlibat di detail harian tiap peserta).

**4. Sahabat Safar (peran pendukung, tidak selalu punya akun sendiri di MVP)**
Rekan seperjalanan yang dicatat sebagai bagian dari Tim Pendukung peserta; interaksinya bisa berupa notifikasi ringan, bukan modul penuh di tahap awal.

## 6. User Stories (contoh inti)

- Sebagai **peserta baru**, saya ingin mengisi Muhasabah, Niat, Area Transformasi, dan Target 90 Hari secara bertahap saat pertama bergabung, agar tidak merasa dibebani satu form panjang sekaligus.
- Sebagai **peserta**, saya ingin melihat habit harian saya (Tahajud, Tilawah, Dzikir, dst.) dalam satu tampilan sederhana dan menandainya selesai dalam satu tap.
- Sebagai **peserta**, saya ingin diingatkan lewat notifikasi sebelum waktu ibadah/habit tertentu, supaya saya tidak lupa.
- Sebagai **peserta**, saya ingin menulis jurnal harian singkat dan (opsional) dirapikan otomatis, tanpa perlu menyusun kalimat sempurna.
- Sebagai **peserta**, saya ingin melihat progres 90 hari saya secara visual (hari ke berapa, % selesai, status per bulan).
- Sebagai **coach**, saya ingin melihat daftar peserta bimbingan saya beserta status "On Track / Need Support" tanpa membuka detail satu per satu.
- Sebagai **peserta**, di hari ke-90 saya ingin diarahkan mengisi Refleksi Akhir sebagai penutup perjalanan.
- Sebagai **admin**, saya ingin mendaftarkan peserta baru dan menautkan mereka ke coach yang sesuai.

## 7. Functional Requirements

### 7.1 Autentikasi & Akun
- Sign up / sign in dengan email + password via Supabase Auth.
- (Opsional fase 2) Magic link dan Google login.
- Reset password.
- Role: `participant`, `coach`, `admin` (disimpan di tabel `profiles`, dicek lewat RLS Supabase).

### 7.2 Onboarding Wizard (PTP digital)
Menggantikan form PTP kertas menjadi wizard 7–8 langkah, diisi sekali di awal, hasilnya jadi data hidup di dashboard:
1. Data peserta & durasi program (mulai — otomatis +90 hari, coach ditugaskan admin).
2. Hasil Muhasabah (insight terbesar tentang diri — textarea).
3. Niat Perubahan ("Karena Allah, saya berkomitmen untuk..." — textarea).
4. Area Transformasi (multi-select): Spiritual Growth, Personal Character, Family Bonding, Leadership/Professional Excellence, Community Impact.
5. Target Perubahan 90 Hari: satu target utama + 3 indikator keberhasilan.
6. Action Plan: daftar aktivitas + frekuensi (bisa tambah baris dinamis) — baris ini juga otomatis menjadi seed data di Habit Engine.
7. Tim Pendukung: nama Coach (biasanya sudah terisi dari penugasan admin) + Sahabat Safar (input bebas).
8. Ringkasan & konfirmasi — setelah ini data menjadi "kontrak perubahan" yang tidak bisa dihapus, hanya bisa diedit dengan riwayat perubahan dasar.

### 7.3 Dashboard Harian
Menggabungkan elemen dari PTP (prioritas) dan referensi M+:
- Header: "Hari ke-X dari 90 Hari" + progress bar keseluruhan.
- Waktu sholat berikutnya + jadwal 5 waktu (lokasi peserta).
- Hadits/quote harian.
- Today's Habits: checklist harian dari Action Plan + habit tambahan (Dzikir Pagi/Petang, Tilawah, dst.), tampil sebagai grid mingguan sederhana.
- Niat Perubahan peserta (ringkas, selalu terlihat sebagai pengingat).
- Target 90 Hari + progres indikator keberhasilan.
- Jurnal hari ini (tulis cepat, opsional AI polish).
- Monitoring Bulanan: status 3 kartu (Bulan 1/2/3) dengan tag On Track / Need Support.
- Pesan/catatan dari Coach (ringkas).
- Notifikasi terbaru.

### 7.4 Habit Engine
- CRUD habit: judul, frekuensi (daily/weekly/custom), waktu pengingat, kategori, target.
- Log harian per habit (selesai/tidak), streak counter, completion rate.
- Habit awal otomatis diisi dari Action Plan onboarding, peserta bisa menambah/mengubah setelahnya.

### 7.5 Reflection & Journal Engine
- Jurnal harian bebas teks, tersimpan per tanggal.
- Fitur "AI Polish" (opsional, fase 2) untuk merapikan tulisan tanpa mengubah makna.
- Refleksi Akhir (hari ke-90): form khusus "Perubahan paling nyata yang saya rasakan setelah 90 hari adalah...".

### 7.6 Monitoring Progress
- 3 checkpoint (Bulan 1: hari 1–30, Bulan 2: 31–60, Bulan 3: 61–90).
- Status per checkpoint: On Track / Need Support + catatan singkat peserta.
- Coach dapat melihat & memberi catatan balasan di checkpoint yang sama.

### 7.7 Profile & Settings
- Data diri, foto profil (Supabase Storage).
- Pengaturan notifikasi (jenis, waktu, on/off per kategori).
- Lokasi (untuk waktu sholat), preferensi tema.

### 7.8 Notification Engine
- Reminder habit (mis. 04:00 Tahajud, 05:30 Dzikir, 20:00 Jurnal) — dijadwalkan via cron + Supabase Edge Function.
- Notifikasi progres (mis. checkpoint bulanan terbuka, program mendekati hari ke-90).
- Kanal awal: in-app + email (Resend). Push notification (FCM) menyusul saat versi mobile tersedia.

### 7.9 Coach View (ringkas untuk MVP)
- Daftar peserta bimbingan + status ringkas (hari ke berapa, On Track/Need Support).
- Halaman detail per peserta: ringkasan PTP, habit completion, jurnal (jika diizinkan dibagikan), catatan monitoring.
- Coach bisa menulis catatan/dukungan singkat yang muncul di dashboard peserta.

### 7.10 Admin Panel (ringkas untuk MVP)
- Kelola peserta (buat akun/undang, tautkan ke coach, atur tanggal mulai program).
- Kelola daftar coach.
- Dashboard kesehatan program (jumlah peserta aktif, distribusi status On Track/Need Support).

## 8. Non-Functional Requirements

- **Performance**: dashboard utama harus first-load < 2.5s pada koneksi 4G rata-rata.
- **Reliability**: reminder notifikasi terkirim dengan toleransi keterlambatan < 5 menit dari waktu terjadwal.
- **Accessibility**: kontras warna sesuai WCAG AA, seluruh interaksi bisa diakses via keyboard di web.
- **Privacy**: jurnal & muhasabah bersifat privat secara default; peserta yang memilih membagikan ke coach harus melakukan aksi eksplisit (opt-in), bukan default terbuka.
- **Maintainability**: satu developer baru harus bisa memahami struktur proyek dan menjalankan dev environment dalam < 1 hari kerja berkat dokumentasi.
- **Scalability**: arsitektur harus mampu menampung ribuan hingga puluhan ribu peserta tanpa migrasi backend besar di tahun pertama.
- **Localization**: bahasa utama Indonesia; struktur teks disiapkan agar mudah ditambah bahasa Inggris di masa depan (tanpa hardcode string di banyak tempat).

## 9. Dashboard Specification

Lihat detail komponen di §7.3. Prinsip layout: satu kolom fokus di mobile, grid 2–3 kolom di desktop, tidak ada widget yang wajib diisi terus-menerus (mendukung prinsip "no guilt-based UX", lihat §"UX Principles" di dokumen Design System).

Empty state untuk setiap widget (Schedule, Jurnal, Goals, Habits) mengikuti nada lembut — bukan pesan kosong generik, tapi ajakan bertindak yang tenang (contoh dari referensi M+: "Belum ada jurnal. Mulai tulis sekarang →").

## 10. Landing Page

Struktur mengikuti materi brand yang sudah ada (lihat poster SLJ):
1. Hero — judul "Spiritual Leadership Journey (SLJ)", tagline "Perjalanan 90 Hari Mengubah Nilai Spiritual Menjadi Kepemimpinan dalam Kehidupan", CTA daftar/konsultasi.
2. Kutipan pembuka program.
3. Empat Tahapan Transformasi Spiritual: Muhasabah → Niyyah → Mujahadah → Istiqamah, masing-masing dengan output-nya (Kesadaran Diri & Baseline Transformasi; Transformation Blueprint & Action Plan; Spiritual Experience & Commitment to Change; Sustainable Personal Transformation).
4. Apa yang didapat: Pendampingan Personal Coach, Learning Community, Monitoring & Reflection, Coaching Bulanan, Final Review & Action Plan.
5. Untuk siapa program ini: Leader & Executive, Entrepreneur & Business Owner, Profesional, Pendidik, Pemimpin Komunitas, siapa pun yang ingin bertumbuh.
6. CTA akhir + kontak (WhatsApp, Instagram @binahub.id, binahub.id).

Interaksi mengikuti referensi MotionSites (scroll reveal antar tahap, animasi progress) — hanya sebagai referensi interaksi, bukan tema visual untuk di-copy (lihat TOOLS-INTEGRATION.md).

## 11. Authentication

- Supabase Auth (email/password sebagai jalur utama).
- Sesi tersimpan otomatis (Supabase `persistSession`) agar peserta tidak perlu login ulang tiap hari.
- Role-based access lewat Row Level Security (RLS) di Postgres — peserta hanya bisa akses datanya sendiri; coach hanya bisa akses data peserta bimbingannya; admin akses penuh dengan audit log dasar.

## 12. User Profile

Field: nama, foto, lokasi (untuk waktu sholat), tanggal mulai & selesai program, coach yang ditugaskan, area transformasi yang dipilih saat onboarding (read-only setelah dikonfirmasi, dengan opsi "ajukan perubahan" yang butuh persetujuan coach — mencegah peserta mengubah "kontrak" secara sepihak).

## 13. Habit Engine

Secara bisnis, Habit **bukan entity independen** — ia adalah turunan dari Action Plan yang diisi peserta saat onboarding PTP. Rantai relasinya:

```
Journey → Goals (Target 90 Hari) → Action Plan → Habit → Habit Log
```

Peserta boleh menambah Habit baru secara manual di luar Action Plan awal, tapi struktur data tetap mencatat asalnya (`action_plan` atau `manual`) agar dashboard bisa selalu menghubungkan kembali kebiasaan harian ke niat dan target 90 hari yang sudah dikonfirmasi peserta — bukan sekadar daftar checklist lepas.

Struktur data konsep (detail teknis di dokumen `Database.md` turunan PRD ini):
```
Habit: title, frequency, reminder_time, category, target, action_plan_id (nullable — null jika manual)
HabitLog: habit_id, date, completed, note?
```
Tampilan streak dan completion rate meniru referensi M+ (grid mingguan per habit) tetapi kategori awal habit mengikuti Action Plan dari form PTP terlebih dahulu.

## 14. Spiritual Journey (PTP Digital)

Ini inti pembeda SLJ dari habit tracker biasa. Seluruh 8 bagian form PTP (§7.2) menjadi entity permanen di database, ditampilkan kembali secara ringkas di dashboard sepanjang 90 hari, dan menjadi dasar isi Refleksi Akhir.

### 14.1 Journey State Machine

Alih-alih menyimpan status peserta sebagai kombinasi boolean/angka terpisah (`started`, `completed`, `checkpoint`), setiap peserta memiliki satu field `journey_status` bertipe enum:

```ts
enum JourneyStatus {
  DRAFT,          // akun dibuat, belum mulai onboarding
  ONBOARDING,     // sedang mengisi wizard PTP
  ACTIVE,         // onboarding selesai, program 90 hari berjalan
  CHECKPOINT_1,   // memasuki jendela monitoring Bulan 1
  CHECKPOINT_2,   // memasuki jendela monitoring Bulan 2
  CHECKPOINT_3,   // memasuki jendela monitoring Bulan 3
  COMPLETED,      // hari ke-90 tercapai, Refleksi Akhir terisi
  ARCHIVED        // program selesai & diarsipkan (mis. lewat retensi tertentu)
}
```

Transisi antar status hanya terjadi lewat fungsi terdefinisi (bukan update field bebas), sehingga tidak mungkin ada kondisi ambigu seperti "aktif tapi belum onboarding". Ini menjadi satu-satunya sumber kebenaran untuk menentukan tampilan dashboard, notifikasi mana yang relevan, dan kapan checkpoint bulanan dibuka untuk peserta.

## 15. Reflection Engine

Jurnal harian + Refleksi Akhir (§7.5). Fase 2: ringkasan otomatis pola jurnal per bulan untuk dibaca peserta ("insight bulan ini") — tidak wajib di MVP.

## 16. Coaching

Coach dapat: melihat daftar bimbingan, membuka detail progres, menulis catatan di checkpoint bulanan. Fase 2: pesan langsung (chat) antara coach dan peserta di dalam platform — di MVP, koordinasi personal tetap lewat WhatsApp seperti biasa, platform hanya menampilkan status dan catatan tertulis.

Spesifikasi lengkap tampilan monitoring lintas-peserta untuk coach (daftar, urutan prioritas, filter, alert) ada di `MONITORING-SYSTEM.md`.

## 17. Notifications

Lihat §7.8. Arsitektur: Supabase Edge Function terjadwal (cron) memeriksa jadwal reminder tiap peserta, mengirim ke tabel `notifications` (in-app) dan/atau memicu email via Resend. Saat versi mobile hadir, kanal push (FCM) ditambahkan tanpa mengubah struktur data notifikasi yang sudah ada.

## 18. Admin Panel

Lihat §7.10. MVP sengaja tipis — cukup untuk mendaftarkan peserta, menugaskan coach, dan memantau kesehatan program secara agregat. Fitur administratif kompleks (yang ada di AMS) sengaja tidak dibawa ke SLJ.

Spesifikasi lengkap tampilan monitoring program agregat, beban kerja per coach, dan aturan flag/alert peserta yang butuh perhatian ada di `MONITORING-SYSTEM.md`.

## 19. Future Mobile

- Stack: React Native + Expo, berbagi Supabase (Auth, Database, Storage) yang sama dengan web.
- Validasi (Zod) dan tipe TypeScript disiapkan agar mudah dipakai ulang jika nanti diekstrak ke package kecil — tidak perlu monorepo di tahap awal.
- Push notification lewat Firebase Cloud Messaging ditambahkan di fase mobile, melengkapi in-app/email yang sudah berjalan di web.
- Detail lanjut ada di `Future-Mobile.md` (bagian dari dokumentasi integrasi §04).

## 20. Technical Constraints

- Tidak menggunakan PHP (keputusan eksplisit).
- Tidak menggunakan arsitektur monorepo di tahap awal (pelajaran dari kompleksitas AMS).
- Backend custom diminimalkan — mengandalkan Supabase sebagai BaaS untuk Auth, Database, Storage, dan Edge Functions.
- Struktur proyek datar (bukan multi-package), lihat §"Struktur Project" pada catatan tech stack.

## 21. Analytics

PostHog untuk product analytics dasar: funnel onboarding wizard, retensi mingguan, event completion habit. Tidak menyimpan isi jurnal/muhasabah di event analytics (hanya metadata, bukan konten).

## 22. Security

- RLS aktif di semua tabel yang menyimpan data personal.
- Validasi input di client (Zod + React Hook Form) dan wajib divalidasi ulang di server/Edge Function (jangan percaya validasi client saja).
- Jurnal dan muhasabah default privat; berbagi ke coach adalah opt-in eksplisit per entri atau pengaturan global yang bisa diubah kapan saja.
- Storage (foto profil, lampiran) menggunakan signed URL, bukan URL publik permanen.

## 23. Release Plan

Prinsip yang dipegang: **tunda kompleksitas sampai benar-benar dibutuhkan** — jangan bayar biaya arsitektur besar sebelum manfaatnya nyata, tapi jangan juga menulis kode yang membuat pertumbuhan ke depan mustahil.

**Fase 1 — Fondasi & MVP (wajib sebelum baris kode pertama produk)**
1. Setup Next.js + Supabase + Drizzle, auth, struktur proyek.
2. Dokumen fondasi: PRD (ini), `Architecture.md`, `Database.md`, `design-tokens.json`, `ADR/` (lihat §27), `DESIGN_QA.md`, `AI_RULES.md`.
3. Onboarding Wizard 8 langkah PTP digital, disimpan sebagai kontrak perubahan dengan `journey_status` (§14.1).
4. Dashboard MVP: habit engine (turunan Action Plan, §13), jurnal harian, waktu sholat, target & indikator.
5. Monitoring & Coach View: checkpoint bulanan, daftar bimbingan coach.
6. Notification Engine: reminder habit via cron + email.
7. Admin Panel tipis + Landing Page publik.
8. Hardening: security review, performance pass, accessibility pass (checklist `DESIGN_QA.md`).

**Fase 2 — Saat development berjalan & mulai ada pengguna nyata**
- PostHog (analytics produk).
- Sentry (error monitoring production) — prioritas tinggi meski murah, karena begitu ada error di production, tim langsung tahu tanpa menunggu laporan peserta.

**Fase 3 — Saat jumlah pengguna mulai signifikan**
- MCP opsional untuk mempercepat development berbantuan AI: Context7 (dokumentasi library terkini agar AI tidak mengarang API), Playwright MCP (screenshot & visual regression otomatis), GitHub MCP (automasi review/PR), Supabase MCP (generate migration & RLS). Diaktifkan hanya kalau terasa manfaatnya — bukan prasyarat MVP.
- Opsional lanjutan: React Scan, Bundle Analyzer, Lighthouse CI — dipertimbangkan saat performa mulai jadi isu nyata, bukan sejak awal.

**Fase 4 — Saat pengembangan mobile dimulai**
- Offline-first + sync queue + conflict resolution.
- Firebase Cloud Messaging (push notification).
- Evaluasi package kecil yang dibagikan web ↔ mobile (Zod schema, tipe TypeScript) — bukan monorepo penuh kecuali benar-benar diperlukan.

Arsitektur berat seperti Domain-Driven Design penuh (repository/application/domain/infrastructure layer terpisah, value objects, event bus/pub-sub) sengaja **tidak** dijadikan prasyarat MVP — struktur `features/journey`, `features/habit`, `features/journal`, `features/coach` (lihat struktur proyek di percakapan tech stack) sudah cukup mencerminkan domain tanpa biaya abstraksi tambahan. Alur event sederhana (mis. "Habit Completed → Insert Habit Log → Update Streak → Create Notification") cukup ditulis sebagai fungsi biasa, bukan event bus, selama tim masih kecil.

## 24. MVP Scope

Termasuk: Auth, Onboarding Wizard PTP, Dashboard harian (habit, jurnal, waktu sholat, target), Monitoring bulanan, Notification reminder dasar (in-app + email), Profile & Settings, Coach view ringkas, Admin panel ringkas, Landing page.

Tidak termasuk di MVP: chat langsung coach–peserta, AI polish jurnal, learning community, aplikasi mobile, gamifikasi/achievement, multi-bahasa.

## 25. Post-MVP (Roadmap lanjutan)

- Aplikasi mobile (React Native + Expo) dengan push notification.
- AI Polish untuk jurnal.
- Learning Community (forum/diskusi antar peserta seangkatan).
- Achievement/badge untuk konsistensi habit (didesain hati-hati agar tetap sejalan dengan prinsip "progress not perfection", bukan gamifikasi yang terasa menghakimi).
- Ringkasan bulanan otomatis dari pola jurnal.
- Dukungan multi-bahasa.

## 26. Risks

- **Scope creep dari referensi M+**: risiko menambah terlalu banyak fitur habit generik sehingga kehilangan fokus pada inti PTP 90 hari. Mitigasi: form PTP selalu jadi prioritas saat ada tumpang tindih fitur (sudah menjadi keputusan produk).
- **Reminder tidak akurat lintas zona waktu**: peserta program bisa berada di lokasi berbeda. Mitigasi: waktu sholat & reminder dihitung dari lokasi yang disimpan peserta, bukan asumsi default.
- **Data sensitif (jurnal/muhasabah)**: risiko kepercayaan jika privasi tidak jelas. Mitigasi: kebijakan privasi opt-in eksplisit (§22).
- **Ketergantungan pada Supabase**: risiko vendor lock-in. Mitigasi: gunakan Drizzle ORM dengan skema SQL standar agar migrasi ke Postgres lain tetap memungkinkan bila diperlukan.
- **Kualitas desain "AI slop"**: risiko dashboard terasa generik seperti template AI. Mitigasi: penggunaan referensi taste (Impeccable Style) dan checklist desain sebelum tiap layar dirilis — lihat TOOLS-INTEGRATION.md.

## 27. Appendix

- Sumber data form: *Personal Transformation Project (PTP)* — dokumen cetak BinaJourney.
- Sumber referensi visual/fitur: dashboard *Muslim Positive (M+) Life OS*.
- Struktur dokumentasi turunan yang direkomendasikan menyertai PRD ini: `Vision.md`, `Product-Principles.md`, `Brand-Guidelines.md`, `Design-System.md`, `design-tokens.json`, `UX-Principles.md`, `UX_COPY_GUIDE.md`, `ILLUSTRATION_GUIDE.md`, `COMPONENT_INVENTORY.md`, `DESIGN_QA.md`, `MONITORING-SYSTEM.md`, `Architecture.md`, `Database.md`, `Coding-Standards.md`, `AI_RULES.md`, `CLAUDE.md`/`AGENTS.md`, `ADR.md` (Architecture Decision Records).
- Referensi produk kualitas UX: Apple Health, Notion, Linear, Headspace, Stoic, Reflect.app, Arc Browser.

---

## Lampiran A — Ringkasan Tech Stack

| Layer | Pilihan | Alasan singkat |
|---|---|---|
| Frontend | Next.js 16 (App Router) | SEO landing page bagus, Server Component, mudah deploy Vercel |
| UI | Shadcn UI + Tailwind CSS + Lucide Icon | Cepat, modern, konsisten |
| State | Zustand | Ringan, tidak butuh Redux |
| Form & Validasi | React Hook Form + Zod | Standar industri, validasi konsisten client & server |
| Auth | Supabase Auth | Email/password, siap magic link & Google login |
| Database | Supabase PostgreSQL | Satu sumber data, RLS bawaan |
| ORM | Drizzle ORM | Ringan, migration cepat, TypeScript-first |
| Storage | Supabase Storage | Foto profil, lampiran jurnal |
| Notifikasi | Cron + Supabase Edge Function + Resend (email); FCM menyusul di mobile | Cukup untuk MVP tanpa infra tambahan |
| Analytics | PostHog | Gratis, cukup untuk funnel & retensi |
| Error Monitoring | Sentry (Fase 2) | Biaya kecil, manfaat besar — production safety net, bukan sekadar optimization tool |
| Deploy | Vercel (frontend) + Supabase (backend) | Tidak perlu VPS/Railway |
| Mobile (lanjutan) | React Native + Expo | Berbagi backend Supabase, tanpa Flutter/Dart baru |

## Lampiran B — Estimasi Tabel Database (≈15 tabel)

`profiles`, `coach`, `participants`, `goals`, `habits`, `habit_logs`, `journals`, `action_plans`, `action_logs`, `notifications`, `reflections`, `monthly_reviews`, `support_team`, `settings`, `achievements`.