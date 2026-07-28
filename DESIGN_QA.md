# Design QA — SLJ

Checklist yang harus lolos untuk **setiap layar baru** sebelum dianggap selesai/di-merge. Ini merapikan checklist yang sudah tersebar di `TOOLS-INTEGRATION.md` (emilkowal.ski/skill, Impeccable Style, Responsively) menjadi satu daftar tunggal yang bisa dicentang di tiap Pull Request.

## Checklist per Layar

- [ ] **Accessibility** — kontras warna sesuai WCAG AA, semua elemen interaktif punya label yang jelas.
- [ ] **Spacing** — whitespace cukup, tidak padat; mengikuti nilai dari `design-tokens.json`, bukan angka bebas.
- [ ] **Loading state** — ada state loading yang dirancang (skeleton/spinner sesuai token), bukan layar kosong tiba-tiba.
- [ ] **Empty state** — dirancang dengan nada tenang & mengajak bertindak (contoh: "Belum ada jurnal. Mulai tulis sekarang →"), bukan pesan generik "No data".
- [ ] **Dark mode** — (jika sudah didukung di fase terkait) kontras dan warna tetap sesuai token di kedua mode.
- [ ] **Responsive** — dicek lewat Responsively di minimal: mobile portrait, tablet, desktop.
- [ ] **Keyboard support** — seluruh interaksi utama bisa dilakukan tanpa mouse (tab order logis, focus state terlihat).
- [ ] **Animation** — transisi halus (durasi & easing dari token), tidak berlebihan, sejalan referensi MotionSites hanya sebagai pola interaksi.
- [ ] **Visual hierarchy** — satu fokus utama per layar, mengikuti checklist Impeccable Style (spacing seimbang, ada elemen yang bisa dihapus tanpa kehilangan makna, typography mengarahkan mata, terasa tenang, terasa "handcrafted").
- [ ] **Tone microcopy** — bahasa reflektif dan memotivasi, bukan menghakimi (sejalan prinsip "no guilt-based UX" dari Design Principles; lihat juga `UX_COPY_GUIDE.md`).
- [ ] **Performance** — tidak ada re-render tidak perlu (khususnya di widget yang update tiap detik seperti countdown waktu sholat).
- [ ] **Forms** — pesan validasi ramah (bukan pesan error teknis mentah), error state terlihat jelas di field yang salah, success state jelas setelah submit berhasil.

## Kapan dijalankan

- Wajib dicek oleh developer sebelum membuka Pull Request yang mengubah UI.
- Wajib dicek ulang oleh reviewer sebelum approve — checklist ini dilampirkan di deskripsi PR.
- Untuk layar kompleks (Dashboard, Onboarding Wizard), checklist dijalankan per-langkah/per-widget, bukan hanya sekali di akhir.

## Relasi dengan dokumen lain

- Nilai konkret (warna, spacing, radius, durasi animasi) sumbernya dari `design-tokens.json` — checklist ini tidak mendefinisikan ulang nilai, hanya memverifikasi kepatuhan.
- Prinsip UX (calm before productive, progress not perfection, dst.) ada di `UX-Principles.md` — checklist ini adalah versi operasional yang bisa dicentang, bukan pengganti dokumen prinsip.
