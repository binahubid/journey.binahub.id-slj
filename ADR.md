# Architecture Decision Records (ADR) — SLJ

Dokumen ini mencatat keputusan arsitektur penting beserta alasannya, agar 6 bulan atau setahun lagi — saat tim bertambah atau ada yang bertanya "kenapa dulu begini?" — jawabannya sudah terdokumentasi, bukan bergantung pada ingatan developer.

Format tiap ADR: **Konteks** (situasi saat keputusan diambil) → **Keputusan** → **Alasan** → **Konsekuensi/Trade-off**.

---

## ADR-001 — Kenapa Next.js?

**Konteks**: Butuh frontend yang melayani landing page publik (perlu SEO bagus) sekaligus dashboard aplikasi (perlu interaktivitas tinggi), dikerjakan tim kecil.
**Keputusan**: Next.js 16 (App Router) sebagai satu-satunya frontend framework, deploy ke Vercel.
**Alasan**: App Router sudah stabil, Server Component mengurangi JS di client, SEO landing page baik secara default, integrasi deploy ke Vercel paling mulus di antara opsi lain.
**Konsekuensi**: Terikat pada konvensi Next.js (routing, data fetching pattern) — dianggap wajar karena ekosistemnya besar dan tim sudah familiar dengan React.

## ADR-002 — Kenapa Supabase?

**Konteks**: Kebutuhan awal (auth, database, storage, notifikasi terjadwal) tidak butuh backend custom yang kompleks; tim ingin backend seminimal mungkin.
**Keputusan**: Supabase sebagai BaaS tunggal untuk Auth, PostgreSQL, Storage, dan Edge Functions.
**Alasan**: Satu vendor untuk auth + database + storage mengurangi permukaan integrasi; RLS bawaan Postgres memudahkan enforcement privasi data personal (jurnal, muhasabah); biaya operasional rendah untuk tim kecil.
**Konsekuensi**: Ada risiko vendor lock-in — dimitigasi lewat ADR-003 (pakai Drizzle dengan skema SQL standar, bukan API proprietary Supabase untuk query utama).

## ADR-003 — Kenapa Drizzle (bukan Prisma)?

**Konteks**: Butuh ORM TypeScript-first untuk Next.js + Postgres.
**Keputusan**: Drizzle ORM.
**Alasan**: Lebih ringan dari Prisma, migration lebih cepat, skema dan query lebih dekat ke SQL asli (memudahkan migrasi keluar dari Supabase jika suatu saat diperlukan — lihat ADR-002), tipe TypeScript terasa lebih natural dipakai bersama Next.js.
**Konsekuensi**: Ekosistem plugin/tooling Drizzle belum sebesar Prisma; dianggap trade-off yang wajar mengingat proyek masih tim kecil dan kebutuhan schema belum terlalu kompleks.

## ADR-004 — Kenapa tidak Flutter untuk rencana mobile?

**Konteks**: SLJ direncanakan berkembang ke Android & iOS setelah versi web matang.
**Keputusan**: React Native + Expo, bukan Flutter.
**Alasan**: Stack tim sudah kuat di React/Next.js; memilih Flutter berarti belajar Dart dan ekosistem baru dari nol, plus duplikasi logika bisnis (validasi, tipe data) yang sudah ditulis di web. React Native + Expo memungkinkan berbagi Supabase client, skema Zod, dan sebagian besar tipe TypeScript dengan web.
**Konsekuensi**: Performa native RN sedikit di bawah Flutter untuk kasus animasi sangat berat — dianggap dapat diterima karena SLJ bukan aplikasi game/grafis intensif.

## ADR-005 — Kenapa tidak monorepo (untuk saat ini)?

**Konteks**: Pengalaman di proyek BinaHub AMS menunjukkan monorepo + backend terpisah + arsitektur event-driven menambah beban kognitif signifikan untuk tim kecil.
**Keputusan**: SLJ web tetap satu repository datar (bukan multi-package/monorepo) selama versi mobile belum dimulai.
**Alasan**: Kompleksitas tooling monorepo (workspace, build orchestration, shared package versioning) belum sepadan dengan manfaatnya di tahap ini — hanya satu aplikasi (web) yang berjalan.
**Konsekuensi**: Saat React Native + Expo (ADR-004) mulai dikembangkan dan ada kebutuhan nyata berbagi kode (skema Zod, tipe TypeScript) dalam jumlah signifikan, keputusan ini akan ditinjau ulang lewat ADR baru — bukan diputuskan di depan tanpa kebutuhan nyata.

---

## ADR-006 — Kenapa Shadcn UI?

**Konteks**: Hampir seluruh komponen UI SLJ (button, card, dialog, tabs, dst.) butuh sumber yang konsisten agar tidak ada developer/AI agent membuat varian berbeda-beda (`ButtonA`, `PrimaryButton`, `MainButton`) untuk kebutuhan yang sama.
**Keputusan**: Shadcn UI sebagai basis komponen utama.
**Alasan**: Aksesibel secara default, komponen bisa dikomposisi (bukan black-box library), berbasis Tailwind sehingga mudah dikustomisasi mengikuti `design-tokens.json`.
**Konsekuensi**: Komponen di-copy ke dalam codebase (bukan diinstal sebagai package), sehingga update dari Shadcn harus dilakukan manual per komponen — dianggap trade-off wajar karena kontrol penuh atas kode lebih penting untuk konsistensi jangka panjang.

## ADR-007 — Kenapa Zustand (bukan Redux)?

**Konteks**: Butuh state management client-side yang ringan untuk kebutuhan seperti state wizard onboarding, filter dashboard, dan UI state lain yang tidak perlu disinkronkan lewat server.
**Keputusan**: Zustand.
**Alasan**: API sederhana, tanpa boilerplate action/reducer seperti Redux, cukup untuk kebutuhan SLJ yang sebagian besar state-nya sebenarnya server state (ditangani lewat fetching Supabase), bukan client state kompleks.
**Konsekuensi**: Tidak ada dev-tools time-travel debugging sekuat Redux — dianggap dapat diterima karena kompleksitas state client SLJ memang rendah.

---

*Catatan: tambahkan ADR baru (ADR-008 dst.) setiap kali ada keputusan arsitektur signifikan berikutnya, jangan mengedit ADR lama — jika keputusan berubah, buat ADR baru yang mereferensikan dan menggantikan ADR sebelumnya.*
