# Changelog — Spiritual Leadership Journey (SLJ)

Semua perubahan penting pada proyek Spiritual Leadership Journey (SLJ) dicatat di sini.

Format berpatokan pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan proyek ini mematuhi [Semantic Versioning](https://semver.org/).

## [0.7.0] — 2026-08-04

### Added
- **Trio Sahabat Safar (Backdoor Pairing)**: Fitur baru untuk kasus peserta ganjil yang tidak punya pasangan. Admin bisa menggabungkan 1 orang unpaired dengan pasangan yang sudah ada → menjadi trio (3 orang saling terhubung). Card trio di tab "Sudah Dipasangkan" menampilkan 3 avatar dengan handshake icons, nama, kota, batch, status IP, serta tombol "Lepas 1 Orang" dan "Bubarkan". Tombol "Buat Trio" tersedia di bar filter batch. Modal 3-step: pilih unpaired → rekomendasi pair paling cocok → konfirmasi. Migration `024_trio_support.sql`: kolom `trio_id`, RPC `pair_trio`, `unpair_trio_member`, `dissolve_trio`.
- **Notifikasi Selamat Datang Otomatis**: Saat user baru enroll (masukkan kode akses), RPC `enroll_participant_by_access_code` otomatis membuat 2 notifikasi: (1) "Selamat datang di BinaJourney!" (category: welcome), (2) "Langkah selanjutnya: Initial Process" (category: onboarding). Dedupe key mencegah duplikasi.
- **Modal Selamat Datang di Dashboard**: Setelah login, dashboard mendeteksi notifikasi welcome yang belum dibaca → menampilkan modal 3 detik kemudian. Isi: ucapan selamat datang, 5 tahapan perjalanan, tombol "Mulai Perjalananku" (navigate ke /initial-process) dan "Nanti Saja". Notifikasi ditandai sudah dibaca setelah dismiss. Migration `025_welcome_notification.sql`.

### Fixed
- **Tab Sudah Dipasangkan Tidak Tampil**: Lookup partner sebelumnya membandingkan `pp.id` dengan `sahabat_safar_user_id` yang menyimpan `user_id` — partner tidak ditemukan. Diperbaiki menjadi `pp.user_id === p.sahabat_safar_user_id`. Card pasangan sekarang tampil normal.
- **Paired Tab Dual IIFE Rendering**: Menggabungkan dua IIFE terpisah (trios + pairs) menjadi satu IIFE yang return `React.ReactNode[]` — memastikan trios dan pairs dirender dalam satu grid container.

### Changed
- **Tombol Trio Dipindah ke Header Filter**: Tombol "Buat Trio" sebelumnya ada di setiap card peserta → dipindah ke bar filter batch (samping dropdown Batch). Card peserta kembali memiliki satu tombol "Cari Rekomendasi Pasangan".
- **NotificationCard & NotificationsPage — Tipe Kategori Diperluas**: Menambahkan kategori `welcome` dan `onboarding` ke type `category` di `NotificationCard` dan halaman `/notifications`.

---

## [0.6.3] — 2026-08-03

### Fixed
- **Dashboard Bento Grids — Full-Width di Tablet**: Semua bento grids (Baris 1 Sholat/Habits/Hadits, Baris 2 Tracking Sholat/Tilawah, Baris 3 Progress Journey/Journal) diubah dari `md:grid-cols-2` ke `lg:grid-cols-2`. Di 768–940px card sekarang full-width (~460px) alih-alih kolom sempit ~222px. PrayerTracker table dan Tilawah card tidak lagi terpotong.

---

## [0.6.2] — 2026-08-03

### Fixed
- **Dashboard Hero — Defer Layout ke lg**: Hero padding `md:p-10→lg:p-10`, top row `sm:flex-row→lg:flex-row`, prayer card `hidden sm:flex→hidden lg:flex`, clock `md:text-8xl→lg:text-8xl`, progress card `sm:min-w-[200px]→lg:min-w-[200px]`, bottom row gap `sm:gap-6→lg:gap-6`, aspect ratio `md:aspect-[16/9]→lg:aspect-[16/9]`. Di 768px (content 458px) greeting "Assalamu'alaikum" dan clock tidak lagi terpotong.

---

## [0.6.1] — 2026-08-03

### Fixed
- **768px–940px Responsive — Defer md:grid-cols-2 ke lg**: Prinsip: sidebar muncul di md (768px), content width turun ke 448px. Layout 2-kolom di md terlalu sempit.
  - Baseline: hero flex-row `sm:→lg:`, scale pills `sm:grid-cols-6→lg:`, metadata card `sm:flex-row→lg:`
  - Journal: mood grid `sm:grid-cols-5→lg:`, pelajaran/perbaikan `md:grid-cols-2→lg:`
  - Settings: lokasi/kota, format jam/tanggal, pengingat toggle `md:grid-cols-2→lg:`
  - Profile: info sections `md:grid-cols-2→lg:`

---

## [0.6.0] — 2026-08-03

### Fixed
- **Desktop 1024px — Defer Layout ke xl**: Di 1024px, sidebar (256px) + padding (64px) → content hanya 704px. Layout internal monitoring sidebar (`lg:w-80`=320px) mempersempit main content ke ~356px.
  - Monitoring: internal right sidebar `lg→xl:flex-row`, `lg:w-80→xl:w-96`
  - Journal: 12-col split `lg→xl:`, `col-span-8/4 lg→xl:`
  - Baseline: intro split `md→xl:`, `col-span-8/4 lg→xl:`
  - Dashboard: clock `lg:text-9xl→xl:text-9xl`, bento 3-col `lg→xl:`

---

## [0.5.9] — 2026-08-03

### Fixed
- **Tablet 768px — Defer md: Grids ke lg**: Di 768px sidebar muncul (256px) + padding (64px) → content hanya 448px.
  - Monitoring: hero flex-row `md:→lg:`, chart+heatmap grid `md:→lg:`, area cards `md:→lg:`, checkpoint+coach `md:→lg:`
  - Dashboard: tambah `md:grid-cols-2` intermediate pada bento grids
  - Baseline: ilustrasi `md:w-72→lg:w-72`, tambah `md:grid-cols-12`
  - Initial Process: stepper `grid-cols-4→grid-cols-2 lg:grid-cols-4`

---

## [0.5.8] — 2026-08-03

### Fixed
- **Mobile Responsive Overflow (320px)**: Audit menyeluruh semua halaman di 320px.
  - Monitoring: hero padding `p-6→p-4` mobile, `truncate` heading/section/sidebar titles, `min-w-0` + `shrink-0` pada flex containers
  - Dashboard: progress card `w-28→w-32` mobile, `min-w-0` pada counter area
  - Journal: `flex-wrap` pada footer privacy row, `truncate` Panduan Istiqamah heading
  - Settings: `overflow-x-auto` TabsList, input+button rows `flex-col sm:flex-row`
  - Profile: `min-w-0 truncate` pada InfoRow values/labels
  - NotificationCard: `min-w-0 truncate` pada title+date row

---

## [0.5.7] — 2026-08-03

### Fixed
- **Mobile Horizontal Scroll**: Tambah `overflow-x-hidden` pada body di root layout. Viewport meta sudah lengkap (`width=device-width, initial-scale=1`). Mengisi celah yang menyebabkan halaman bisa digeser ke kanan/kiri di mobile.
- **Safar Reminder Button**: Ganti text button menjadi icon `Bell` saja — lebih compact dan tidak memakan lebar. Tooltip tetap ada saat hover.

---

## [0.5.6] — 2026-08-03

### Changed
- **Dashboard Hero — Area Progress Line Graph**: Progress bar diganti dengan grafik garis akumulasi dari 3 area transformasi. Satu garis amber gradient yang menunjukkan progres kumulatif (rata-rata) dari seluruh area. Mengambil data dari action_plans → habits → habit_logs secara real-time.

---

## [0.5.5] — 2026-08-02

### Fixed
- **Mobile Width Alignment**: Seluruh halaman (monitoring, journal, profile, settings, notifications, initial process, baseline) sekarang memiliki padding horizontal yang konsisten dengan dashboard di mobile. Menghapus double padding yang menyebabkan konten lebih sempit dari dashboard.

---

## [0.5.4] — 2026-08-02

### Changed
- **Hero Profile — OGL SideRays**: Background hero profile menggunakan animated WebGL SideRays (via `ogl` library) dengan warna amber `#C79A3C` dan `#F5ECCB` — efek sinar cahaya yang bergerak dinamis dari top-right. Hapus teks "Kartu Peserta SLJ" dari hero.
- **Profile Info Sections — Borderless Minimalist**: Seluruh info sections (Akun & Program, Koneksi, Informasi Diri, Area Transformasi) tidak lagi menggunakan card dengan border. Menggunakan gaya `divide-y` halus seperti section roadmap di landing page — lebih modern dan bernafas.
- **Settings Page — Borderless Minimalist**: Sama dengan profile — form settings dan footer legal tidak lagi dibungkus card dengan border. Tabs tetap berfungsi, layout lebih clean.
- **SideRays Component**: Component React + WebGL baru (`src/components/SideRays.tsx`) dengan IntersectionObserver (hanya render saat visible), cleanup WebGL context yang proper, dan props yang fully customizable.

---

## [0.5.3] — 2026-08-02

### Added
- **User ID Pendek (`display_id`, 6 digit)**: Kolom baru di `profiles` dengan auto-generate via trigger PostgreSQL dan backfill user existing. Tampil di halaman Profile (chip amber mono) dan Admin Participants (kolom ID + search by ID). Migration `023_add_display_id.sql`.
- **App Icon Khusus (`app-icon.webp`)**: Icon aplikasi terpisah dari favicon untuk PWA install, Apple touch icon, shortcut, dan maskable. Favicon tetap `journey-icon.webp`.
- **Badge Notifikasi di Icon App**: Badge count unread di icon PWA via Badge API — set saat push masuk, clear saat notifikasi diklik, sync otomatis saat halaman notifikasi dibuka/ditandai dibaca.

### Changed
- **Redesign Halaman Profile — "Digital Passport"**: Hero card navy gradient dengan ambient glow, avatar squircle besar 96px, chip ID mono amber, StatusPill dengan dot indikator, journey progress bar (Hari ke-X/90 + tanggal mulai–selesai). Info direstrukturisasi dari satu list panjang menjadi bento grid 2 kolom: Akun & Program, Koneksi & Sahabat Safar, Informasi Diri, dan Area Transformasi.

### Security
- **Hapus Hardcoded Secret di `cron-setup.sql`**: `REMINDER_CRON_SECRET` dan URL project diganti menjadi placeholder `<YOUR_REMINDER_CRON_SECRET>` dan `<YOUR_SUPABASE_URL>` menanggapi temuan GitGuardian. Instruksi setup eksplisit ditambahkan di header file.

---

## [0.5.2] — 2026-08-02

### Added
- **Panduan Mujahadah di Journal Harian**: Card collapsible amber dengan 3 pertanyaan panduan refleksi harian — muncul di atas form journal setiap hari. Klik untuk buka/tutup, konsisten dengan style panduan muhasabah/niyyah di journey setup.
- **Panduan Istiqamah — Refleksi 90 Hari**: Card collapsible amber dengan 3 pertanyaan panduan komitmen pasca-90 hari — muncul secara kondisional hanya pada hari ke-90 journey. Membantu peserta merenungkan perubahan, tantangan, dan kebiasaan yang akan dijaga.

---

## [0.5.1] — 2026-08-02

### Added
- **Pengingat Waktu Sholat via Aladhan API**: Edge Function `send-user-reminders` mengambil waktu sholat berdasarkan kota dan zona waktu peserta dari Aladhan API, lalu mengirim pengingat 10 menit sebelum waktu sholat tiba. Cache per kota per hari mengurangi jumlah request API.
- **Enforce Social Notification Preference**: Trigger `allow_social_notification` di database — jika user mematikan notifikasi sosial di Settings, notifikasi kategori `coach` dan `system` tidak akan masuk ke tabel `notifications`.
- **Notifikasi Respons Coach ke Peserta**: Trigger `notify_monthly_review_coach_reply` — ketika coach menulis atau memperbarui catatan checkpoint, peserta otomatis mendapat notifikasi "Coach memberikan respons" dengan tautan ke halaman Monitoring.
- **Dokumentasi Setup Reminder (`supabase/REMINDERS_SETUP.md`)**: Panduan lengkap langkah demi langkah untuk mengatur migration, VAPID keys, Edge Function secrets, deploy, dan cron schedule.
- **Script Cron Setup (`supabase/cron-setup.sql`)**: Script SQL siap pakai untuk menjadwalkan Edge Function setiap 5 menit via `pg_cron` + `pg_net`.

### Fixed
- **TypeScript Web Push Type Error**: Memperbaiki tipe `applicationServerKey` dari `Uint8Array` ke `ArrayBuffer` pada `urlBase64ToArrayBuffer()` di `src/lib/web-push.ts` — error ini muncul karena TypeScript 5+ tidak menganggap `Uint8Array` sebagai `ArrayBufferView` secara implisit.

---

## [0.5.0] — 2026-08-02

### Added
- **User Reminder & Web Push Pipeline (Migration 022)**: Preferensi pengingat per user, tabel `push_subscriptions`, deduplication notifikasi, generator reminder timezone-aware, serta RPC antrean pengiriman Web Push.
- **Pengingat Otomatis Peserta**: Habit pukul 20.00 dan jurnal pukul 21.00 aktif secara default; tilawah, waktu sholat, dan hadits tersedia sebagai pilihan opsional. Checkpoint, inactivity, respons coach, Sahabat Safar, dan batch auto-lock ikut didukung.
- **Notifikasi HP (Web Push)**: Tombol aktivasi di halaman Settings, browser permission flow, subscription perangkat ke Supabase, Service Worker penerima push, dan Edge Function `send-user-reminders` untuk pengiriman ke notification tray HP.
- **PWA / Home Screen Install**: Manifest, Service Worker, offline fallback, install prompt Android, serta instruksi Add to Home Screen untuk iPhone/iPad.
- **Halaman Syarat & Ketentuan (`/terms`)**: Halaman baru berisi dokumen asli "Syarat & Ketentuan Pelaksanaan Program Spiritual Leadership Journey" berformat resmi. Tautan di footer landing, halaman register/AuthModal, login, dan menu sidebar peserta.
- **Halaman Audit Log Admin (`/admin/audit`)**: Menampilkan riwayat perubahan data kritis (companies, batches, profiles, journeys) dengan filter tabel/aksi, diff viewer, dan pagination. Dibangun dari tabel `audit_log` via RPC `get_audit_log()`.
- **Tabel `audit_log` & Trigger Otomatis (Migration 020)**: Tabel PostgreSQL yang mencatat setiap INSERT/UPDATE/DELETE pada tabel companies, batches, profiles, dan journeys secara otomatis melalui trigger database — tanpa logging di aplikasi.
- **Lifecycle RPCs Perusahaan (Migration 021)**: RPC `update_company()`, `deactivate_company()` (dengan guard referensi), `reactivate_company()`, `delete_company()`, dan `get_company_referential_status()`.
- **Lifecycle UI pada Detail Perusahaan (`/admin/companies/[id]`)**: Tombol Edit nama perusahaan, Nonaktifkan (dengan guard referensi dari DB — menolak jika ada batch/peserta aktif), dan Aktifkan kembali. Modals konfirmasi terpisah.
- **Monitoring Alerts Otomatis (Migration 015 + UI)**: Tabel `monitoring_alerts` + RPC `run_monitoring_automation()` untuk auto-lock batch lewat tenggat, deteksi inactivity peserta, dan coach response alerts. Section "Monitoring Alerts (Otomatis)" di halaman notifikasi admin.
- **Switcher Demo/Live Report (`/admin/report`)**: Halaman laporan terbagi menjadi Demo Report (data fixture v0.4.5 untuk presentasi) dan Live Report (data aktual dari canonical monitoring view). Default menampilkan Demo Report. Tombol Export PDF pada kedua mode.
- **Kanban Company Detail (`/admin/companies/[id]`)**: Tampilan 5 tab (Overview, Batch, Coach, Participant, Analytics) dengan health score komputasi, referential status dari DB, dan not-found page 404 profesional.
- **Helper Timezone (`getLocalDateString`)**: Fungsi `getLocalDateString(date, timezone)` di `src/lib/local-date.ts` yang mendukung timezone IANA untuk perhitungan tanggal lokal peserta (termasuk perjalanan luar negeri).
- **Auto/Manual Timezone di Settings (`/settings`)**: Mode Auto (deteksi otomatis perangkat, disimpan ke `profiles.timezone`) dan Manual (pilih zona waktu sendiri). Mendukung perjalanan ke Makkah/Madinah, Australia, dll.
- **Enrollment Server-Side (Migration 012)**: RPC `enroll_participant_by_access_code` mengikat user ke company/batch canonical dari database saat submit onboarding.
- **Unique Constraint Pairing (Migration 013)**: Index unik `support_team.user_id` + trigger validasi bahwa pasangan pairing dua arah (A → B dan B → A harus konsisten).
- **Admin Monitoring Canonical View (Migration 014)**: View `admin_participant_monitoring` + RPC `get_admin_monitoring` sebagai satu-sumber kebenaran untuk data monitoring — menghitung habit completion 0–100%, daysInactive, needsSupport. Seluruh halaman admin sekarang menggunakan canonical view ini.
- **TypeScript Shared Admin Types (`src/lib/admin-types.ts`)**: Tipe terpusat `MonitoringRow`, `RawMonitoringRow`, `ReferentialStatus`, `AutomationResult`, `BroadcastScope`, `mapMonitoringRow()` untuk konsistensi tipe di seluruh halaman admin.
- **Error Taxonomy (`AppError` + `parseSupabaseError`)**: Tipe error terstruktur dengan kategori `duplicate`, `permission`, `network`, `not_found`, `validation`, `unknown`. Pesan error yang spesifik untuk user berdasarkan jenis error Supabase.

### Changed
- **Restrukturisasi Semua Halaman Admin ke Canonical Monitoring**: Halaman `/admin/participants`, `/admin/monitoring`, `/admin/dashboard` sekarang mengambil data dari RPC `get_admin_monitoring()` — menghapus seluruh mock data, hardcoded fallback, dan `localStorage` sebagai sumber data.
- **Rewrite Company Detail (`/admin/companies/[id]`)**: Fetch langsung dari Supabase, computed health score (habit × 0.6 + support ratio × 0.4), coach/participant dari canonical monitoring, tidak ada lagi `INITIAL_*` atau `localStorage` fallback.
- **Rewrite Company List (`/admin/companies`)**: Fetch dari Supabase langsung, hapus semua `saveCompanies()` ke localStorage.
- **Rewrite HR Portal (`/company`)**: Fetch dari Supabase langsung, hapus `localStorage` reads.
- **Admin Dashboard (`/admin/page.tsx`)**: Health score dari canonical monitoring, coach count dari FK, participant count dari canonical — hapus hardcoded 95.
- **Company Store (`company-store.ts`)**: `fetchCompaniesFromSupabase()` dan `createCompanyInSupabase()` sekarang melempar `AppError` (bukan return null atau catch silently). Import `parseSupabaseError` di callers.
- **Batch Fallback Names**: Mengganti fallback data `"Corporate Mitra"` dan `"Coach Pendamping"` menjadi `"Belum ditentukan"` pada data paths (bukan UI labels).
- **Timezone Semua Halaman Harian**: Dashboard, PrayerTracker, QuranTracker, DailyHadithWidget, Journal, dan Settings menggunakan `getLocalDateString(profileTimeZone)` — tanggal dihitung berdasarkan zona waktu peserta, bukan UTC.
- **Profile Page**: Halaman profile sekarang read-only — tidak menulis ulang role ke database.
- **CSS Radius Global**: Override `.rounded-3xl → 14px`, `.rounded-2xl → 12px`, `.rounded-xl → 8px` di `globals.css` untuk mengurangi tampilan "AI slop" dan mencapai estetika lebih profesional.

### Fixed
- **Health Score Companies dari Canonical Monitoring**: Menghapus hardcoded `healthScore: 95` pada `fetchCompaniesFromSupabase()`. Score sekarang dihitung dari `get_admin_monitoring()` RPC: `habit × 0.6 + (100 − support_ratio) × 0.4`.
- **PrayerTracker Upsert**: Menambahkan `onConflict` pada upsert untuk menghindari duplicate rows.
- **QuranTracker Validasi Ayat**: Validasi jumlah ayat per surat sebelum submit.
- **DailyHadithWidget Saving Guard**: Mencegah double-submit dengan saving state + rollback on error.
- **Batch Access Code Dynamic Year**: Mengganti hardcoded `"2027"` → `new Date().getFullYear()`.
- **Batch Default Dates Dynamic**: Mengganti hardcoded `"2027-02-01"` → computed (bulan depan + 4 bulan).
- **Batches Page Error Handling**: `loadData()` dengan try/catch + loading state.
- **Coaches Page Error Handling**: Loading state, error state, empty state.
- **Monitoring Page Refresh**: Mengganti `window.location.reload()` → panggil `loadAllData()`.
- **Referential Status Guard**: Button "Nonaktifkan" disabled jika `referentialStatus.can_deactivate === false`.

### Security
- **Role Authorization Dual-Source (Migration 019)**: `is_admin()` membaca JWT `app_metadata.role` DAN `profiles.role` — mencegah escalation jika admin menghapus role dari profiles.
- **Trigger `prevent_participant_profile_escalation` (Migration 012)**: Mencegah peserta/coach mengubah role sendiri via profile update.
- **Pairing Transactional (Migration 013)**: `pair_sahabat_safar()` menjalankan semua operasi dalam satu transaksi database — menggagalkan seluruh operasi jika ada langkah yang gagal.

---

## [0.4.0] — 2026-08-01

### Added
- **Sistem Gating & Proteksi Halaman Monitoring (`/monitoring`)**: Halaman dikunci penuh bagi peserta yang belum memiliki record PTP (`!journeyId`), dengan tombol pengarah otomatis ke `/journey/setup`.
- **Sensitivitas Tenggat Pengisian Bulanan (+7 Hari)**: Mengimplementasikan logika penguncian tombol input capaian bulanan (Bulan 1: Aktif Hari 1–37, dikunci Hari 38+; Bulan 2: Aktif Hari 31–67, dikunci Hari 68+; Bulan 3: Aktif Hari 61–97). Tombol pada bulan yang belum/tidak aktif dikunci secara fisik dengan status penjelas.
- **Filter Indikator Bulanan Dinamis**: Kartu Area Transformasi dan Modal Input Capaian Bulanan kini hanya menampilkan indikator (*Kualitas, Kuantitas, Waktu, Biaya*) yang benar-benar diisi oleh pengguna pada PTP.
- **Integrasi Baseline pada Journey Health Scores**: Menampilkan nilai rata-rata persentase baseline secara otomatis ketika laporan bulanan belum diisi untuk menghilangkan tampilan `--`.

### Changed
- **Penyederhanaan Form Initial Process (`/initial-process`)**:
  - Menyederhanakan slider Step 2 agar hanya menampilkan angka poin saja.
  - Sederhanakan tombol navigasi versi mobile (Step 1-3: `"Lanjut"`, Step 4: `"Submit"`).
  - Mengganti seluruh istilah `Admin Fasilitator` menjadi `Tim binaJourney`.
  - Mengubah tombol konfirmasi pengiriman menjadi `Edit Jawaban` dan `Ke Dashboard`.
- **Restrukturisasi Journey PTP (`/journey`)**:
  - Mengubah wizard Journey menjadi **4 Step Utama** (menghapus Step 5 Refleksi Akhir 90 Hari yang dialihkan ke Monitoring).
  - Mengubah background *Reflection Guide* menjadi warna solid dark navy (`bg-[#071A33]`).
- **Pembaruan Baseline Self-Discovery (`/baseline`)**:
  - Menambahkan *auto-scroll* otomatis ke atas halaman saat berpindah step.
  - Mengubah kartu *Jeda Refleksi* menjadi *expandable accordion* berwarna solid dark navy (`bg-[#071A33]`) dengan border emas (`border-amber-400`).
  - Memperbarui teks ringkasan skor baseline menjadi: *"Titik awal kondisi diri Anda sebelum memasuki Personal Transformation Project."*.
- **Optimalisasi Monitoring & Grid Istiqomah (`/monitoring`)**:
  - Membedakan label persentase skor baseline (`67% Skor Baseline`) dari persentase laporan bulanan (`67% Capaian`).
  - Menggabungkan habit dari `action_plans` dan `habits` table serta mencocokkan log harian via ID dan Title.
  - Menyembunyikan indikator kosong dan menyajikan input rating 1-5 Bintang jika target 4D tidak diisi.
  - Mengubah perhitungan level Grid Istiqomah (Heatmap 90 Hari) agar langsung menyala hijau berdasarkan jumlah habit yang dicentang (`>= 1`).
  - Redesain modal input capaian bulanan agar responsif dan nyaman di perangkat mobile (`max-h-[88vh]`, input `h-10`, stacked footer).
  - Mengunci seksi *Refleksi Akhir Program (90 Hari)* hingga peserta memasuki `Hari ke-89` (`dayCount < 89`).
- **Prayer Tracker & Mobile Dashboard**:
  - Menghapus tombol `X` inline pada baris sholat sunnah di `PrayerTracker.tsx` (pengelolaan sunnah terpusat via modal).
  - Menghapus kartu *Sholat Berikutnya* khusus tampilan mobile di bawah hero banner dashboard.

---

## [0.3.1] — 2026-07-31

### Added
- **Form Sahabat Safar Matching Profile (`/initial-process`)**: Mengimplementasikan kuesioner instrumen pairing Sahabat Safar lengkap (Layer 1 Eligibility, Layer 2 Allocation 100 Poin, Layer 3 Support Exchange, dan Journey Preference) sesuai spesifikasi `BinaJourney_Sahabat_Safar_Profile_v1.0.md`. Data tersimpan otomatis ke `localStorage` dan tabel Supabase `sahabat_safar_profiles`.

### Changed
- **Penyederhanaan Journey dari 5 Step menjadi 4 Step**:
  - Menggabungkan **Step 3 (Area Transformasi)** dan **Step 4 (Sasaran & Indikator)** menjadi **1 Step terintegrasi ("Area Transformasi")**.
  - Memastikan **default `selectedAreas` kosong (`[]`)** untuk pendaftar baru sehingga tidak terceklis otomatis pada Spiritual Growth.
  - Menghapus tombol shortcut/preset contoh di bawah textarea 4 dimensi agar tampilan form lebih bersih.
  - Mengembalikan **Ikon Informasi `(i)`** dengan hover tooltip rumus kalkulasi skor monitoring untuk tiap 4 dimensi indikator.
  - Menambahkan **Fitur Expand/Collapse Sidebar Desktop** (ikon `PanelLeftClose`/`PanelLeftOpen`) untuk mengecilkan panel kiri navigator dan memperluas area editor tengah.
  - **Redesain UI/UX Step 4 Action Plan (Habit Engine)**: Menambahkan chips **Rekomendasi Kebiasaan Pilihan (1-Klik Tambah)** per area fokus, meredesain form custom habit dengan pill radio frekuensi (Harian/Pekanan), quick target counter (`1x`, `2x`, `3x`, `5x`, `7x`), dan kartu daftar kebiasaan yang lebih elegan & responsif.
- **Hadith Collapsible pada Step 2 (Niat Perubahan)**: Teks hadith niat kini dibungkus *accordion collapsible* (default tertutup) di desktop maupun mobile.
- **Debounced Batch Autosave Baseline Self-Discovery**: Mengoptimalkan autosave jawaban Baseline dengan sistem *debounced batching* (1.5 detik) dan penyimpanan otomatis saat berpindah step. Mengurangi panggilan API database hingga 90% untuk mendukung penggunaan simultan (20+ user sekaligus).
- **Icon Screen Saver Dashboard**: Menghapus teks `"Screen Saver"` dan background transparan pada tombol Screen Saver di Home Dashboard — disederhanakan menjadi ikon saja tanpa mengurangi fungsi klik fullscreen modal.

---

## [0.3.0] — 2026-07-30

### Added
- **Menu & Halaman Initial Process**: Menambahkan menu baru `Initial Process` di atas `Baseline Self-Discovery` pada sidebar & mobile drawer layout, serta membuat halaman `src/app/initial-process/page.tsx`.
- **Shortcut Indikator Transformasi (5 Preset per Dimensi)**: Menambahkan 5 tombol shortcut preset yang dapat diklik langsung untuk tiap dimensi indikator (Kualitas, Kuantitas, Waktu, Biaya) pada 5 area transformasi.

### Changed
- **Penyederhanaan Journey menjadi 5 Step**: Menghapus Step 6 (Tim Pendukung / Sahabat Safar) dari alur Journey mandiri peserta. Penentuan Sahabat Safar dialihkan untuk ditentukan oleh Admin berdasarkan hasil evaluasi *Initial Process*.
- **Revisi CEO Landing Page (12 Poin Teks & Copywriting)**: Mengubah narasi Hero Section ("serta kepemimpinan anda"), Roadmap Transformasi (Coaching), Nilai Tambah Utama (Ritual Ibadah + Transformasi Diri + Peningkatan Performa), Key Benefits, Purpose-Driven Leadership, dan FAQ.
- **Restrukturisasi Area Transformasi**: Mengganti `Family Bonding` menjadi `Relationship`, menghapus area `Health & Wellbeing`, serta memperbarui deskripsi kelima area transformasi (Spiritual Growth, Personal Development, Leadership Excellence, Relationship, Community Impact).
- **Standardisasi Istilah PTP**: Mengganti seluruh istilah kata `"kontrak"` di seluruh platform menjadi **`"Personal Transformation Project"`** atau **`"PTP"`**.
- **Autosave Otomatis Baseline Self-Discovery**: Setiap jawaban soal pada Baseline Self-Discovery disimpan secara otomatis ke local state, cache `localStorage`, dan `supabase.from("baseline_answers").upsert`.
- **Baseline Self-Discovery Soal #39**: Mengubah teks soal dari `"Saya ingin meninggalkan amal jariyah yang terus memberi manfaat"` menjadi `"Saya ingin memberikan amal jariyah yang terus memberikan manfaat."`.
- **Admin Impact & ROI Report**:
  - Mengubah sebutan `"Direct Supervisor"` menjadi `"Direct Superior"`.
  - Membatasi grafik tren ROI menjadi 3 bulan (`3 Bulan (Program 90 Hari)`).
  - Mengubah nama section dari `"Perubahan Kinerja"` menjadi `"Baseline Result (Before vs After)"`.
- **Dashboard Progress Journey Counter**: Mengubah teks countdown streak dari `5 Terbaik Beruntun` menjadi `5 Hari konsistensi berturut-turut`.
- **UI/UX Input & Stepper Kuantitas Mobile**: Menambahkan tombol stepper `-` dan `+` serta perbaikan input numerik pada Action Plan Journey agar mudah diubah dan dihapus di smartphone.
- **Navigasi Mobile Baseline**: Menyembunyikan dock navigasi bawah seluler secara otomatis saat pengguna berada di alur Baseline Self-Discovery (`/baseline`).
- **Optimalisasi Responsif Halaman Journal**: Memperbaiki layout 5 mood card, padding container, grid feed riwayat refleksi, dan tampilan jam digital adaptif pada perangkat mobile.

---

## [0.2.0] — 2026-07-30

### Added
- **Changelog & Versioning**: Menambahkan dokumentasi `CHANGELOG.md` dan menaikkan versi proyek menjadi `v0.2.0` pada `package.json`.
- **Gitignore Rules**: Menambahkan `*.md` ke `.gitignore` untuk mengecualikan seluruh dokumentasi internal markdown dari pelacakan version control.

### Changed
- **Pembersihan Em-Dash**: Menghapus seluruh karakter em-dash (`—` / `&mdash;`) di seluruh Landing Page dan menggantikannya dengan struktur tata bahasa yang alami.
- **Section 2 (Penyebab Utama)**: Mengubah layout 4 penyebab penurunan semangat di tampilan mobile menjadi format **2 kolom (grid-cols-2)**.
- **Section 5 (Roadmap Transformasi Mobile)**: Memperbarui tampilan Mobile Vertical Timeline mengikuti aturan `COMPONENT_INVENTORY.md` (hairline vertikal emas di kiri, penataan judul & deskripsi di kanan, tanpa card box tebal).
- **Section 8 (Key Benefits)**: Mengadaptasi komponen `Card (interactive)` dari `COMPONENT_INVENTORY.md` dan mengeneralisasi grid 2 kolom di mobile (`grid grid-cols-2 lg:grid-cols-3`).
- **Hero Section Ribbon Badge**: Menyesuaikan posisi hanging ribbon badge secara responsif — **Top-Right** pada Desktop (`>= md`) dan **Top-Center** pada Mobile (`< md`) dengan padding aman untuk mencegah teks tertutupi.
- **Visual Vector Chart (MotivationDeclineChart)**: Menyelaraskan teks label sumbu X SVG (`Hari 1`, `Hari 30`, `Hari 60`, `Hari 90`) secara presisi dengan titik koordinat kurva SVG.
- **Mobile Responsive Typography**: Mengoptimalkan skala font judul (`text-2xl` di mobile) dan mengencangkan padding container di seluruh 13 section landing page.

---

## [0.1.0] — 2026-07-15

### Added
- Inisialisasi proyek Next.js 15 dengan TailwindCSS & TypeScript.
- Struktur dasar Landing Page SLJ, komponen domain (`MotivationDeclineChart`, `Baseline Form`), dan desain token awal (`design-tokens.json`).
