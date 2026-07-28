# Monitoring System — Coach & Admin (SLJ)

Dokumen ini melengkapi PRD §16 (Coaching) dan §18 (Admin Panel), yang sengaja ditulis tipis untuk MVP. Di sini dirancang secara konkret bagaimana coach memonitor peserta bimbingannya dan bagaimana admin memonitor kesehatan program secara keseluruhan — tanpa menambah kompleksitas backend (tidak perlu event bus atau sistem alert terpisah, cukup query/computed view di atas data yang sudah ada: `journey_status`, `habit_logs`, `monthly_reviews`).

## Prinsip

- Coach dan admin tidak perlu "menyelami" data satu peserta untuk tahu siapa yang butuh perhatian — ringkasan status harus terlihat di level daftar (list view), bukan hanya di detail.
- Nada tetap sejalan `UX_COPY_GUIDE.md` — status "Need Support" ditampilkan sebagai informasi netral untuk ditindaklanjuti, bukan label yang terkesan menghakimi peserta.
- Semua indikator monitoring dihitung dari data yang sudah ada di §7 PRD (habit log, checkpoint, journey_status) — tidak perlu tabel/infra tambahan di MVP.

---

## 1. Coach Monitoring View

### 1.1 Daftar Peserta Bimbingan

Tabel/daftar dengan kolom:

| Kolom | Sumber Data | Catatan |
|---|---|---|
| Nama Peserta | `profiles` | — |
| Hari ke- / dari 90 | `journey_status` + tanggal mulai | mis. "Hari ke-42" |
| Status Perjalanan | `journey_status` (enum §14.1) | ONBOARDING / ACTIVE / CHECKPOINT_1-3 / COMPLETED |
| Habit Completion (7 hari terakhir) | agregat `habit_logs` | ditampilkan sebagai % + mini sparkline |
| Status Checkpoint Terakhir | `monthly_reviews` | On Track / Need Support / Belum Diisi |
| Terakhir Aktif | timestamp login/aktivitas terakhir | untuk mendeteksi peserta yang menghilang |
| Flag Perhatian | dihitung (lihat §3 Alert Rules) | ikon/badge, bukan kolom terpisah yang mencolok |

### 1.2 Urutan Default

Peserta dengan **Flag Perhatian aktif** ditampilkan lebih dulu, lalu berdasarkan checkpoint yang paling mendekati tenggat. Coach tidak perlu menyortir manual untuk tahu siapa yang perlu dihubungi duluan.

### 1.3 Filter

Filter tersedia untuk: Status Perjalanan, ada/tidaknya Flag Perhatian, rentang hari program (mis. "mendekati hari ke-90").

### 1.4 Detail per Peserta (saat diklik dari daftar)

Ringkasan PTP (Muhasabah, Niat, Target 90 Hari, Area Transformasi — read-only), riwayat habit completion, jurnal (hanya jika peserta mengizinkan berbagi ke coach — opt-in, lihat PRD §22 Security), riwayat catatan checkpoint per bulan, kolom untuk coach menulis catatan/dukungan baru.

### 1.5 Komponen UI

Menggunakan `Coach Card` dan `Checkpoint Card` dari `COMPONENT_INVENTORY.md`; tambahkan satu komponen baru ke inventory: **Participant Monitoring Row** (Card + Badge + mini progress), didaftarkan sebelum dipakai di lebih dari satu halaman sesuai aturan inventory.

---

## 2. Admin Monitoring View

Admin tidak melihat detail harian tiap peserta (itu ranah coach) — admin melihat **kesehatan program secara agregat**.

### 2.1 Ringkasan Program

- Jumlah peserta per `journey_status` (berapa yang masih Onboarding, berapa Active, berapa sudah Completed).
- Distribusi status checkpoint terakhir secara keseluruhan (% On Track vs % Need Support) — angka ini yang sudah direncanakan di PRD §7.10, sekarang dipertegas sumber datanya.
- Jumlah peserta dengan Flag Perhatian aktif dan belum ditindaklanjuti coach (lihat §3).

### 2.2 Monitoring per Coach (Beban Kerja)

Tabel: Nama Coach, jumlah peserta bimbingan, jumlah peserta dengan Flag Perhatian aktif, rata-rata waktu respons coach terhadap checkpoint (opsional, hanya jika datanya mudah dihitung dari timestamp catatan coach). Tujuannya bukan menilai kinerja coach secara ketat di MVP, tetapi membantu admin melihat kalau ada satu coach yang bebannya jauh lebih berat dari yang lain.

### 2.3 Peserta yang Butuh Intervensi Admin

Daftar khusus untuk kasus yang di luar jangkauan coach biasa, mis.: peserta tidak aktif >14 hari tanpa catatan dari coach, atau checkpoint terlewat tanpa ada tindak lanjut tercatat sama sekali. Ini adalah satu-satunya bagian di mana admin melihat nama peserta individual — di luar itu, admin bekerja di level agregat.

---

## 3. Alert / Flag Rules (ringan, berbasis cron — bukan event bus)

Dihitung berkala (mis. sekali sehari lewat Supabase Edge Function terjadwal yang sama dengan reminder di PRD §17), bukan sistem event real-time terpisah:

| Kondisi | Flag |
|---|---|
| Tidak ada habit log terisi 5 hari berturut-turut | "Perlu Perhatian — Habit Terhenti" |
| Checkpoint bulanan sudah dibuka tapi belum diisi peserta setelah 7 hari | "Perlu Perhatian — Checkpoint Belum Diisi" |
| Status checkpoint terakhir = "Need Support" dan belum ada catatan balasan coach dalam 3 hari | "Perlu Tindak Lanjut Coach" |
| Peserta tidak login/aktif >14 hari | "Tidak Aktif" (eskalasi ke admin sesuai §2.3) |

Flag ini murni hasil query terjadwal (bukan tabel event terpisah) — cukup ditulis sebagai fungsi yang membaca `habit_logs`, `monthly_reviews`, dan timestamp aktivitas, lalu menghasilkan badge di UI. Sejalan dengan prinsip "tunda kompleksitas" di PRD §23 — tidak perlu event-driven architecture untuk kebutuhan ini.

### Notifikasi terkait Flag

- Coach menerima notifikasi in-app/email saat salah satu peserta bimbingannya mendapat flag baru (memanfaatkan Notification Engine yang sama di PRD §17, tidak perlu kanal baru).
- Admin menerima ringkasan mingguan (bukan real-time) berisi jumlah flag aktif dan peserta yang masuk kategori §2.3.

---

## 4. Yang Sengaja Tidak Dibangun di MVP

- Dashboard analitik coach yang detail (grafik tren per peserta lintas waktu) — cukup angka ringkas dulu, grafik detail menyusul di Fase 2/3 bila datanya sudah menunjukkan pola yang layak divisualisasikan.
- Sistem skor kinerja coach otomatis — berisiko terasa menghakimi dan belum perlu untuk ukuran program saat ini.
- Alert real-time (push instan saat kondisi terjadi) — cukup cron harian/mingguan, sejalan prinsip "delay complexity until it becomes inevitable" yang sudah dipakai di seluruh dokumentasi SLJ.