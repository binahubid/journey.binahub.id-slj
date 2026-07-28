# UX Copy Guide — SLJ

Panduan nada microcopy di seluruh SLJ: notifikasi, pesan error, empty state, CTA. Prinsip dasarnya sama dengan UX Principles produk: **reflektif dan memotivasi, bukan menghakimi** — sejalan dengan "no guilt-based UX" dan "progress not perfection".

## Prinsip Nada

- Bicara seperti pendamping yang tenang, bukan sistem yang menegur.
- Jangan pernah menyalahkan peserta atas ketidak-konsistenan (habit terlewat, jurnal kosong, target belum tercapai).
- Ajak bertindak dengan kalimat singkat, bukan memberi instruksi yang terasa kaku.
- Hindari jargon teknis di pesan yang dilihat peserta (pesan error mentah hanya untuk log internal, bukan UI).

## Contoh Transformasi

| Jangan | Pakai |
|---|---|
| `Failed` | "Belum berhasil disimpan. Silakan coba lagi." |
| `No Data` | "Belum ada jurnal hari ini. Mulailah menulis satu refleksi kecil." |
| `Error: field required` | "Bagian ini perlu diisi dulu ya, sebelum lanjut ke langkah berikutnya." |
| `Habit missed` | "Hari ini belum sempat — besok masih ada kesempatan." |
| `0% completed` | "Baru mulai — setiap langkah kecil tetap dihitung." |
| `Deadline passed` | "Checkpoint bulan ini sudah lewat, tapi kamu tetap bisa lanjutkan perjalanan." |

## Empty State (per widget)

- **Jurnal**: "Belum ada jurnal hari ini. Mulailah menulis satu refleksi kecil."
- **Habit**: "Belum ada kebiasaan yang ditambahkan. Mulai dari Action Plan yang sudah kamu tulis di awal perjalanan."
- **Notifikasi**: "Belum ada notifikasi baru."
- **Schedule**: "Belum ada agenda. Tambahkan yang pertama →"

## Pesan Validasi Form

- Selalu jelaskan *apa yang perlu diperbaiki*, bukan hanya menandai merah.
- Contoh: "Niat Perubahan minimal 10 karakter — coba ceritakan sedikit lebih lengkap."
- Success state singkat dan tenang: "Tersimpan." — bukan tanda seru berlebihan atau confetti yang terasa berlebihan untuk konteks refleksi spiritual.

## Notifikasi Reminder

- Format singkat, tanpa nada memaksa. Contoh: "Waktunya Tahajud — 04:00" bukan "JANGAN LEWATKAN TAHAJUD!!!".
- Reminder yang terlewat tidak perlu ditandai sebagai "gagal" — cukup hilang dari daftar aktif hari itu.

## Istilah Konsisten (jangan campur sinonim)

- "Peserta" (bukan "user" atau "jamaah" bergantian) untuk audiens umum di UI.
- "Coach" (bukan "pembimbing" bergantian) untuk peran pendamping.
- "Checkpoint" untuk monitoring bulanan (bukan "milestone" atau "review" bergantian).
- "Perjalanan" untuk merujuk program 90 hari secara keseluruhan (selaras dengan `journey_status` di data).
