# Kesiapan SLJ — 14 November 2026

## Status

Implementasi tersedia pada branch codex/slj-trial-readiness-2026-11-13.
SQL33 telah dikonfirmasi pengguna. RPC penawaran di Supabase SLJ mengembalikan
HTTP 200 dengan trial aktif selama 14 hari. Deploy ulang Edge Function
memerlukan sesi login Supabase CLI. Tidak ada environment variable atau jadwal
cron baru. Tidak ada email atau push produksi yang dikirim selama pengujian.

## Keputusan yang diterapkan dari meeting 13 November

- Uji coba gratis berjalan selama 14 × 24 jam sejak aktivasi, satu kali per akun
  dengan email terverifikasi.
- Trial mencakup salat, catatan Al-Qur’an, hadits harian, dan jurnal refleksi.
- Pengembangan diri, kepemimpinan, relasi, dan kontribusi tampil sebagai
  pratinjau terkunci.
- Kode program tetap digunakan untuk program pendampingan yang sudah ada.
  Pindah dari trial memulai durasi program baru dan mempertahankan catatan.
- Pendaftaran trial dapat dibuka, ditutup, atau diberi tanggal akhir oleh admin.
  Belum ditetapkan tanggal promosi terakhir, sehingga pengaturan awal tidak
  menambahkan tanggal batas rekaan.
- Pilihan 1/2/3 bulan menampilkan estimasi awal Rp3/Rp5/Rp7 juta per peserta.
  CTA menuju percakapan dengan BinaHub. Pembayaran, harga pembanding/diskon,
  jumlah sesi coaching, dan aktivasi otomatis paket berbayar belum diterapkan.
- Berkuda menjadi aktivitas tambahan yang dibahas terpisah.

## Temuan dan perbaikan

| Temuan | Perbaikan | Bukti |
| --- | --- | --- |
| Akun baru hanya dapat bergabung dengan kode, dan form meminta organisasi meskipun keanggotaan ditentukan oleh kode | Dua pilihan mulai: trial dan kode program; organisasi mengikuti kode yang sah | Uji aktivasi dan alur browser |
| Pembatas trial pada UI dapat dilewati melalui akses data langsung | RLS, trigger tulis, dan pemeriksaan RPC assessment/PTP memakai status pada database | Pengujian SQL sebagai beberapa akun |
| Waktu trial bisa berbeda antargawai apabila hanya dihitung pada browser | Database menyimpan waktu mulai dan akhir yang otoritatif, riwayat unik per akun | Pengujian aktivasi, retry, expiry, dan migration berulang |
| Upgrade trial mengurangi durasi program bila memakai tanggal mulai trial | Enrollment program mengawali ulang periode program pada saat upgrade | Uji upgrade dan retensi catatan |
| Cookie sesi baru hilang ketika middleware mengarahkan pengguna | Redirect menyalin cookie sesi yang diperbarui | Regresi middleware |
| Peserta belum bergabung terhalang membuka halaman publik panduan | Gate onboarding diterapkan pada rute privat | Regresi middleware |
| Navigasi mobile sulit dipahami dan kontrol kecil | Label Indonesia, dock sederhana, drawer berfokus, area sentuh, safe area, serta zoom | Uji 320/390/768/1366 piksel |
| Dialog tidak menahan fokus atau mengembalikan fokus ke tombol pembuka | Dialog Radix, dukungan Escape, fokus kembali ke pembuka | Uji keyboard browser |
| Penyimpanan salat dapat berlomba pada klik berulang dan gagal tanpa pesan yang terlihat | Penanda simpan per aktivitas, rollback, pesan gagal, dan pemuatan ulang | Uji simpan, reload, serta kegagalan koneksi |
| Jadwal Makkah/Madinah memakai negara Indonesia dan jam lokal perangkat | Helper bersama untuk kota, metode, tanggal, dan zona waktu; Kemenag untuk Indonesia, Umm Al-Qura untuk kota Arab Saudi yang didukung | Uji URL, zona waktu, serta GET publik Aladhan |
| Pengingat program penuh dapat masuk pada trial atau setelah trial berakhir | Filter database dan worker berdasarkan enrollment trial; tautan dan pesan disesuaikan | Uji database pengingat |
| Badge PWA memakai API pada objek yang keliru | Gunakan WorkerNavigator, termasuk menghapus badge saat unread nol | Regresi service worker |
| Tautan notifikasi dapat menunjuk keluar origin aplikasi | Tautan dibatasi pada origin SLJ dan fallback ke Notifikasi | Regresi service worker |
| Login dapat tersimpan sebagai hasil redirect pada cache shell | Cache hanya menyimpan shell publik/offline, versi cache diperbarui | Regresi service worker |
| Build bergantung pada pengunduhan font Google | Plus Jakarta Sans lokal, lisensi OFL disertakan | Build tanpa koneksi ke Google Fonts |
| Dependensi dan pemeriksaan kualitas belum seragam | Pembaruan paket, override minimatch terbatas pada parser, ESLint CLI dan CI tanpa kredensial produksi | Audit npm, lint, typecheck, build |

## Validasi lokal

- 57 pengujian pada 11 berkas lulus.
- 12 pengujian database memakai PGlite. Bootstrap memakai schema sumber,
  schema tambahan, RLS konsolidasi, dan migration 005–032 sebelum SQL33.
  Migration 001–004 telah dikonsolidasikan pada src/db/rls.sql.
- Lint tidak memiliki warning/error dan TypeScript lulus.
- Build Next.js 15.5.29 berhasil, termasuk dengan konfigurasi Supabase
  sintetis untuk CI. Tidak diperlukan kredensial produksi saat build.
- npm audit tidak melaporkan kerentanan yang diketahui pada dependensi
  produksi maupun development pada saat pemeriksaan ini.
- Browser menguji komponen SLJ asli dengan provider sintetis pada lebar
  320/390/768/1366: simpan dan reload salat, rollback, fokus/Escape dialog,
  catatan Al-Qur’an, hadits, preview terkunci, expiry, onboarding, dan
  pengaturan admin. Semua permintaan luar fixture diblokir atau dimock.
- Halaman publik dari server Next produksi lokal juga diperiksa pada empat
  ukuran: Home, Panduan, Login, dan Daftar.
- Screenshot dan hasil browser berada di tmp/slj-ui-evidence, bukan aset
  produksi atau data peserta sungguhan.
- Strix belum dapat dijalankan karena Docker Linux engine tidak aktif dan
  model tidak tersedia pada environment proses. Pemeriksaan ini tidak
  dinyatakan sebagai pentest lengkap atau jaminan bebas kerentanan.

## Aktivasi produksi

1. Pilih Supabase yang terhubung dengan SLJ/journey.binahub.id. Jangan
   menjalankan migration ini pada database API utama BinaHub atau AMS.
2. Di SQL Editor, jalankan supabase/migrations/033_spiritual_trial_access.sql.
   Gunakan berkas final pada branch ini. SQL dapat diulang tanpa mereset
   pengaturan pendaftaran, tanggal trial, atau catatan peserta.
3. Jika SQL33 sempat dijalankan dari draf sebelum seluruh pemeriksaan selesai,
   ulangi berkas final. Pengujian idempotensi memastikan pengaturan dan
   tanggal trial tetap sama.
4. Login CLI Supabase melalui browser dengan perintah supabase login.
   Tidak perlu menyalin token ke chat atau menyimpannya dalam repository.
5. Ambil project ref SLJ dari alamat dashboard Supabase
   (bagian setelah /project/). Jalankan dari repository SLJ:

       .\tools\deploy-reminder-worker.ps1 -ProjectRef <project-ref-SLJ>

   Script memakai --use-api sehingga deploy function tidak memerlukan Docker.
   --no-verify-jwt mempertahankan mekanisme x-cron-secret yang sudah ada.
6. Merge/push kode yang sudah lulus pemeriksaan ke main dan pastikan deployment
   Vercel selesai. Jadwal cron dan seluruh secret yang ada tetap digunakan.
7. Buka Admin SLJ → Uji coba spiritual, periksa status pendaftaran dan daftar
   peserta. Tombol simpan mengatur pendaftaran baru tanpa memotong trial aktif.
8. Lakukan uji manual akun peserta yang ditunjuk CEO dan verifikasi notifikasi
   pada HP peserta uji yang telah memberikan izin.

Jangan mengganti VAPID, anon key, service-role key, atau secret cron hanya untuk
rilis ini. Jangan menjalankan ulang setup cron lama tanpa memeriksa jadwal yang
sudah aktif.

## Skenario uji manual sebelum demo CEO

1. Akun baru: daftar dengan Google atau email, selesaikan verifikasi email,
   lalu pilih Uji coba gratis pada halaman mulai.
2. Isi nama dan kota yang sesuai. Pastikan aktivasi berhasil dan masa trial
   dihitung sejak aktivasi, bukan sejak membuat akun.
3. Tandai satu salat, muat ulang halaman, dan pastikan tanda tetap tersimpan.
4. Tambahkan catatan Al-Qur’an, tandai hadits dibaca, dan tulis jurnal.
5. Buka area pengembangan lain. Yang muncul adalah penjelasan preview,
   tanpa form program penuh.
6. Ubah kota dan zona waktu melalui Pengaturan. Untuk perjalanan Umrah,
   periksa Makkah/Madinah dan waktu Arab Saudi.
7. Admin melihat peserta baru di Uji coba spiritual. Tutup dan buka kembali
   pendaftaran untuk memastikan trial yang aktif tetap dapat digunakan.
8. Gunakan satu peserta uji dengan kode program yang sah untuk memeriksa
   jalur program penuh dan peningkatan dari trial.
9. Pada HP yang mendukung, instal PWA dan aktifkan pengingat di Pengaturan.
   Periksa izin browser/OS dan hasilnya pada perangkat, termasuk keadaan
   aplikasi ditutup. Tampilan angka/dot badge berbeda menurut perangkat.
10. Bagikan /panduan kepada CEO dan peserta.

## Pemeriksaan yang masih memerlukan produksi

- Penerapan SQL33 dan status deployment worker/frontend.
- Login Google dan verifikasi email pada akun peserta uji nyata.
- Jadwal cron SLJ yang sedang aktif serta log invocation worker setelah rilis.
- Izin dan penerimaan notifikasi pada Android/iPhone fisik.
- Pengamatan antrean ketika sebagian endpoint push gagal, serta uji beban
  terkontrol. Uji browser terisolasi tidak menggantikan pemeriksaan ini.
- Penetapan promosi terakhir dan rincian paket pendampingan berbayar oleh CEO.

## Sumber teknis yang diverifikasi

- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Metode dan data waktu salat: https://api.aladhan.com/v1/methods
- App Badging API: https://developer.chrome.com/docs/capabilities/web-apis/badging-api
- Advisory minimatch: https://github.com/advisories/GHSA-g3hv-75wg-m249

Pekerjaan di luar SLJ tetap dicatat pada draf daftar kerja setelah SLJ di
repository app-binahub. File dan perubahan lain yang sudah ada tidak ikut
dirilis melalui branch SLJ ini.
