# Component Inventory — SLJ

Daftar tunggal komponen UI yang boleh dipakai. Tujuannya supaya developer maupun AI coding agent tidak membuat varian berbeda untuk kebutuhan yang sama (mis. `ButtonA`, `PrimaryButton`, `MainButton`). Kalau butuh komponen baru, tambahkan ke daftar ini dulu — jangan membuat komponen ad-hoc di tengah halaman.

Basis komponen: Shadcn UI (lihat ADR-006), dikustomisasi memakai `design-tokens.json`.

## Primitif (dari Shadcn UI)

| Komponen | Variant | Catatan |
|---|---|---|
| Button | `primary`, `secondary`, `ghost`, `destructive` | Satu ukuran default + `sm`; hindari membuat ukuran baru tanpa alasan kuat |
| Input | `text`, `textarea`, `number` | Selalu sertakan label & pesan validasi (lihat `UX_COPY_GUIDE.md`) |
| Card | `default`, `interactive` (hover state) | Dasar untuk semua "card" turunan di bawah |
| Dialog | modal konfirmasi | Dipakai untuk aksi destruktif (mis. hapus habit) |
| Sheet | panel geser dari sisi layar | Dipakai untuk form tambahan di mobile-width |
| Tabs | navigasi antar sub-halaman atau kelompok data setara | Dipakai di Profile/Settings dan pemisah Habit Harian/Pekanan |
| Progress | bar linear | Dipakai untuk progres 90 hari & indikator target |
| Checkbox | single, grid mingguan | Basis untuk Habit checklist harian |
| Badge | `success` (On Track), `warning` (Need Support) | Warna dari token semantic (`success`, `warning`) |

## Komponen Domain (turunan primitif di atas, khusus SLJ)

| Komponen | Dibangun dari | Usage |
|---|---|---|
| **Habit Card** | Card + Checkbox grid + Badge | Menampilkan satu habit + streak + completion mingguan di dashboard |
| **Journal Card** | Card + Textarea | Entry jurnal harian, dengan state kosong khusus (lihat `UX_COPY_GUIDE.md`) |
| **Timeline** | Progress + custom marker | Menampilkan 4 Tahapan Transformasi (Muhasabah → Niyyah → Mujahadah → Istiqamah). Varian wajib: `grid-2x2` untuk desktop/tablet (dua baris dua kolom, nomor tipografis besar, tanpa connector-line), `vertical` untuk mobile (hairline vertikal di kiri + nomor berjejer turun sejajar judul/deskripsi di kanan). Bukan sekadar stacking default framework — dua varian ini didesain eksplisit. |
| **Journey Card** | Card + Progress + Badge | Ringkasan "Hari ke-X dari 90 Hari" + status `journey_status` (lihat PRD §14.1) |
| **Coach Card** | Card + Avatar | Menampilkan info coach & catatan singkat di dashboard peserta |
| **Notification Card** | Card + icon | Item di daftar notifikasi in-app |
| **Checkpoint Card** | Card + Badge + Textarea | Kartu Bulan 1/2/3 di Monitoring Progress, dengan status On Track/Need Support |
| **Motivation Decline Chart** | Line/area chart minim (tanpa gradient/drop shadow) | Grafik penurunan semangat Hari 1-90 di landing page section "Masalah yang Kami Pecahkan" — warna navy/gold, label checkpoint di sumbu X |

## Props & Variant — aturan umum

- Setiap komponen domain baru wajib didokumentasikan di sini sebelum dipakai di lebih dari satu halaman.
- Props warna/spacing/radius **tidak boleh** hardcode nilai — selalu rujuk `design-tokens.json`.
- Variant baru pada primitif (mis. `Button` warna baru) harus melalui alasan tertulis di PR, bukan ditambah bebas.

## Belum ada, akan ditambah saat dibutuhkan

Achievement/Badge gamifikasi, Chat bubble (coach–peserta) — sengaja belum masuk daftar karena fitur ini di luar scope MVP (lihat PRD §24–25). Tambahkan ke tabel di atas saat fitur tersebut mulai dikerjakan, bukan disiapkan lebih awal.
