# Tools Integration — SLJ Platform

Dokumen ini mendefinisikan *kapan dan bagaimana* setiap tool boleh dipakai dalam pengembangan SLJ, supaya tim (manusia maupun AI coding agent) konsisten dan tidak menghasilkan desain generik ("AI slop"). Disusun berdasarkan prioritas: **Wajib Dipakai**, **Sangat Berguna**, **Nice to Have**, dan **Belum Diperlukan**.

---

## ⭐ Wajib Dipakai

### 1. emilkowal.ski/skill
**Purpose**: Referensi UI/UX untuk dashboard aplikasi React (empty state, onboarding, layout dashboard, animasi, komposisi komponen, pola SaaS).
**Kapan dipakai**: Sebelum membangun/mengubah layout dashboard, onboarding wizard, atau halaman utama peserta.
**Checklist sebelum tiap halaman dashboard dirilis**:
- Whitespace cukup, tidak padat.
- Visual hierarchy jelas (satu fokus utama per layar).
- Ada empty state yang dirancang, bukan kosong begitu saja.
- Ada loading state.
- Hover & keyboard support berfungsi.
**Aturan**: Referensi pola interaksi, bukan tema visual mentah — hasil akhir tetap harus terasa seperti "Apple Health / Notion / Linear", bukan admin panel biasa.

### 2. Uiverse
**URL**: https://uiverse.io
**Purpose**: Sumber komponen kecil (checkbox, switch, loading, empty state, button, card, progress bar) yang lebih hidup dibanding komponen default.
**Kapan dipakai**: Saat membangun elemen interaktif kecil di Habit Engine (mis. checklist harian) dan indikator progres.
**Boleh**: checkbox, toggle, progress, loading, tooltip, badge.
**Tidak boleh**: meng-clone seluruh halaman atau menyalin palet warna langsung dari contoh Uiverse — warna tetap mengikuti Design System SLJ sendiri.

### 3. MotionSites AI
**URL**: https://motionsites.ai
**Purpose**: Inspirasi animasi & struktur landing page yang tidak statis.
**Kapan dipakai**: Saat membangun/menyempurnakan Landing Page publik SLJ (§10 PRD).
**Referensi alur**: Hero → Scroll → Timeline perjalanan spiritual (4 Tahapan Transformasi) → Progress animation → CTA.
**Aturan**: Jangan copy langsung. Gunakan hanya sebagai referensi interaksi (scroll reveal, timing animasi), bukan sebagai *design source*.

### 4. Impeccable Style
**URL**: https://impeccable.style
**Purpose**: Bukan UI kit — ini referensi *design taste* (spacing, typography, hierarchy, whitespace, visual rhythm) agar hasil tidak terasa seperti dibuat AI generik.
**Kapan dipakai**: Sebagai self-check sebelum setiap layar baru dianggap selesai.
**Checklist wajib per layar**:
- Apakah spacing terasa seimbang?
- Apakah ada elemen yang bisa dihapus tanpa kehilangan makna?
- Apakah typography mengarahkan mata pengguna dengan jelas?
- Apakah tampilan terasa tenang (calm), bukan ramai?
- Apakah terasa "handcrafted", bukan template generik?

---

## Sangat Berguna

### 5. Penpot
**Purpose**: Alternatif Figma yang gratis & open source, cocok untuk membangun design system jika tim mulai membesar.
**Kapan dipakai**: Saat kolaborasi desain melibatkan lebih dari satu orang. Selama masih dikerjakan sendiri, Figma yang sudah dipakai tetap cukup — Penpot disiapkan sebagai opsi migrasi, bukan kewajiban sekarang.

### 6. Responsively
**URL**: https://responsively.app
**Purpose**: Preview banyak ukuran layar sekaligus (desktop, tablet, phone, landscape, portrait) tanpa bolak-balik buka DevTools.
**Kapan dipakai**: Wajib dicek di setiap Pull Request yang mengubah tampilan — landing page dan dashboard SLJ harus tetap bagus di semua ukuran karena rencana ke mobile web dan app di masa depan.

### 7. ntfy
**URL**: https://ntfy.sh
**Purpose**: Push notification ringan untuk kebutuhan development/testing tanpa setup Firebase penuh.
**Kapan dipakai**:
- **Development**: menguji alur reminder habit (mis. Supabase Edge Function → ntfy → langsung ke HP developer) sebelum sistem notifikasi in-app/email final selesai dibangun.
- **Production (sementara)**: tidak direkomendasikan sebagai kanal notifikasi utama untuk peserta — kanal produksi tetap in-app + email (Resend), lalu bermigrasi ke Firebase Cloud Messaging saat versi mobile hadir (lihat §19 & §17 PRD).

### 8. Sentry
**Purpose**: Error monitoring production. Begitu ada error nyata (mis. "Cannot read property..."), tim langsung tahu tanpa menunggu peserta lapor.
**Kapan dipakai**: Diaktifkan di Fase 2 (begitu development mulai berjalan menuju pengguna nyata), bersamaan dengan PostHog.
**Aturan**: Ini bukan sekadar optimization tool — perlakukan sebagai *production safety net* dengan prioritas tinggi walau biayanya kecil, berbeda dari React Scan/Bundle Analyzer/Lighthouse CI yang boleh menyusul lebih lambat.

---

## Opsional — MCP untuk AI Coding Agent (Fase 3, bukan blocker MVP)

Empat MCP berikut valid dan bisa mempercepat kerja AI coding agent, tapi **jangan dijadikan syarat mulai development**. Aktifkan satu per satu hanya kalau manfaatnya terasa nyata, sama seperti sikap terhadap NeedMCP di bagian "Belum Diperlukan" di bawah.

- **Context7** — dokumentasi library selalu up-to-date, mencegah AI mengarang API yang sudah berubah.
- **Playwright MCP** — screenshot, accessibility check, dan visual regression otomatis setiap halaman selesai.
- **GitHub MCP** — AI bisa membuat, mereview, dan meringkas Pull Request.
- **Supabase MCP** — AI bisa generate migration, inspect schema, dan generate RLS langsung dari deskripsi kebutuhan.

Didokumentasikan di `MCP_INTEGRATION.md` sebagai daftar opsional per fase, bukan prasyarat Fase 1.

---

## Nice to Have

### TasteSkill
**Purpose**: Latihan meningkatkan *taste* desain secara umum.
**Kapan dipakai**: Pembelajaran personal, bukan bagian dari workflow harian proyek.

### Drawgle
**Purpose**: Alat brainstorming visual (flow onboarding, user journey, habit flow, action plan flow).
**Kapan dipakai**: Tahap awal perencanaan sebelum membangun UI, terutama untuk memetakan alur wizard onboarding PTP digital (§7.2 PRD) sebelum ditransfer ke desain UI.

---

## Belum Diperlukan

### Sevalla
Masih bisa digantikan sepenuhnya oleh Vercel untuk kebutuhan hosting SLJ saat ini.

### NeedMCP
Baru terasa manfaatnya ketika penggunaan Claude Code/Cursor/Codex CLI/Windsurf sudah sangat intensif dan butuh koordinasi banyak MCP sekaligus. Untuk tahap sekarang belum wajib — cukup didokumentasikan sebagai opsi masa depan di `MCP_INTEGRATION.md`.

---

---

## Prohibited (berlaku untuk semua tool inspirasi di atas)

- Jangan meng-copy UI 1:1 dari referensi manapun.
- Jangan meng-copy palet warna langsung — warna tetap mengikuti `design-tokens.json`.
- Jangan mereproduksi ilustrasi berhak cipta.
- Jangan mencampur banyak sumber inspirasi sekaligus dalam satu layar (hasilnya tidak konsisten, terasa seperti tempelan).

---

## Workflow Ringkas (urutan pemakaian tool per tahap)

1. **Requirement** → Drawgle → User Flow
2. **UI Inspiration** → MotionSites (landing) + emilkowal.ski/skill (dashboard) → Impeccable Style (self-check taste)
3. **Component** → Shadcn UI (basis) + Uiverse (aksen komponen kecil)
4. **Coding** → Cursor/Codex/Claude Code → Next.js + Supabase
5. **Responsive check** → Responsively (wajib tiap PR)
6. **Notification testing** → ntfy (dev) → migrasi ke email/Resend (production) → FCM (saat mobile)

## Catatan Penting

Sesuai kesepakatan awal: **bukan tool yang menentukan kualitas SLJ, tapi Design System dan disiplin memakai checklist di atas**. Masalah umum dashboard bertema Islami — ikon berlebihan, hijau di mana-mana, ornamen masjid berlebih, layout seperti aplikasi pemerintah, padding sempit, hierarki visual lemah — dihindari justru dengan disiplin checklist Impeccable Style dan referensi emilkowal.ski di atas, bukan dengan menambah lebih banyak tool.
