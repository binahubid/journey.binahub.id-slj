# Illustration Guide — SLJ

Panduan visual untuk menjaga identitas SLJ tetap editorial dan tenang, sesuai kekhawatiran utama: menghindari tampilan generik "AI slop" dan klise dashboard Islami yang terlalu ramai.

## Dihindari

- 3D gradient blob (elemen dekoratif generik khas produk AI-generated).
- Ilustrasi acak yang tidak berkaitan langsung dengan konten.
- Karikatur/kartun bertema muslim generik.
- Ikon masjid/kubah di mana-mana sebagai dekorasi berulang.
- Dominasi warna hijau berlebihan (klise dashboard Islami).
- Emoji besar sebagai elemen visual utama.
- Ornamen kaligrafi/geometris berlebihan yang membuat layar terasa ramai, bukan tenang.
- **Icon-in-circle berulang** — ikon dibungkus lingkaran berwarna, dipakai lagi dan lagi di section berbeda (mini-stat, feature card, audience chip) dengan pola visual yang sama. Maksimal satu motif icon-in-circle dominan per halaman.
- **Card berbingkai (border) yang diulang sebagai pola utama layout** — mengelompokkan tiap poin ke dalam kotak bergaris di banyak section beruntun (grid 3-4 card demi 3-4 card) adalah pola SaaS template generik, bukan editorial. Pisahkan konten dengan whitespace, bukan border, kecuali untuk elemen yang memang butuh penekanan sebagai satu unit (mis. satu Journey Card di dashboard).

### Card yang Diperbolehkan (referensi: pola Zūm CMX)

Card tidak sepenuhnya dilarang — yang dilarang adalah **outline/border tipis + ikon lingkaran** yang diulang sebagai dekorasi generik. Dua pola card berikut boleh dipakai karena terasa editorial, bukan template:

1. **Solid-fill stat block** — panel angka besar (mis. persentase habit completion, jumlah peserta) dengan latar warna solid pekat (navy `#0F1E3D` atau varian gelapnya), tipografi angka besar, tanpa border tipis dan tanpa ikon. Dipakai untuk highlight statistik penting, maksimal satu baris/section per halaman.
2. **Image-anchored content card** — card yang isinya benar-benar dipimpin oleh foto/gambar spesifik (testimoni peserta dengan foto, artikel/update program), bukan poin generik yang dibungkus kotak supaya "rapi". Bedanya: card jenis ini tidak akan masuk akal tanpa gambar di dalamnya; card generik (icon+judul+deskripsi) tetap masuk akal tanpa gambar — itu tandanya harus dihindari.

### Section Alternating (Zigzag), bukan Grid Fitur

Untuk landing page, ganti pola "grid 3-4 feature card sejajar" dengan **section alternating**: satu fitur = satu section penuh (kicker label kecil + headline + paragraf di satu sisi, foto full-bleed besar di sisi lain), posisi teks/foto berselang-seling (kiri-kanan-kiri-kanan) turun ke bawah halaman. Ini memberi tiap fitur ruang bercerita sendiri dan otomatis memvariasikan bobot visual antar-section (lihat poin "Ritme section yang seragam" di atas).

### Kicker Label + Italic Accent Typography

Sebagai pengganti ikon untuk memberi "kehangatan" pada headline: gunakan **kicker label kecil** (teks pendek huruf kapital/pill kecil) di atas headline, dan **satu-dua kata kunci di dalam headline dicetak italic dengan warna aksen emas** (`#C79A3C`) — bukan seluruh kalimat berwarna, cukup satu frasa penekanan. Contoh pola: "Deliver students on time and *ready to learn*" → untuk SLJ bisa: "Ubah niat menjadi *kebiasaan yang bertahan*."

### Dark Section sebagai Jeda Visual

Sisipkan satu-dua section berlatar navy pekat penuh (`#0F1E3D`) di antara section terang, dipakai untuk data/statistik yang butuh penekanan (mis. dampak transformasi, peta sebaran peserta) — bukan dekorasi, tapi jeda ritme scroll sekaligus tempat solid-fill stat block di atas paling pas ditaruh.
- **Connector-line generik** (lingkaran bernomor + garis putus-putus horizontal) untuk menunjukkan proses/tahapan — ini komponen umum di UI kit (Uiverse dsb., lihat `TOOLS-INTEGRATION.md` § Prohibited) dan langsung terasa template kalau di-copy apa adanya.
- **Ritme section yang seragam** — tiap section landing page berbobot visual sama (judul + subjudul + grid ikon) dari atas sampai bawah membuat halaman terasa monoton saat di-scroll.

## Yang Dipakai

- **Editorial** — foto/ilustrasi terasa seperti dipilih dengan kurasi, bukan ditempel asal.
- **Minimal** — satu elemen visual per bagian, dengan banyak whitespace di sekitarnya.
- **Warm** — palet hangat (lihat `background: #FAF8F4` di `design-tokens.json`), bukan putih dingin atau hijau tajam.
- **Calm** — komposisi tenang, garis bersih, tidak banyak elemen bersaing perhatian.
- **Human** — jika memakai foto manusia (seperti di poster brand SLJ — jamaah menghadap Ka'bah), pilih momen yang terasa personal dan reflektif, bukan stok foto generik yang terlihat dipasang-pasang.
- **Tipografi sebagai elemen visual utama** — headline besar, line-height ketat, dengan whitespace di sekitarnya sebagai "dekorasi" — bukan ikon atau border. Referensi: hero Apple/Stripe/Vercel, di mana judul besar sendiri sudah jadi fokus visual tanpa perlu elemen pendukung berlebih.
- **Nomor tipografis untuk tahapan/urutan** — angka besar bergaya tipografi (bukan dibungkus lingkaran + garis penghubung) dipisahkan lewat whitespace lebar antar-item, bukan connector line.
- **Bobot visual section bervariasi** — sengaja bergantian antara section besar/dominan (mis. hero, foto penuh) dan section sangat minim (satu baris teks + ruang kosong luas), supaya scroll terasa berirama, bukan rata dari atas ke bawah.

### Motif Geometris Islami Minimal (satu-satunya elemen dekoratif yang diizinkan)

Supaya identitas "startup Islami" tidak hilang di balik estetika SaaS Barat generik, ada **satu** motif dekoratif yang boleh dipakai — dan hanya satu, bukan berulang di banyak tempat: garis tipis (hairline) dengan penanda bintang geometris 8 sudut kecil, monoline, sangat kecil, warna emas pudar (`accent` dengan opacity rendah). Dipakai **maksimal di 1-2 titik krusial per halaman** — misalnya di tengah divider antara section Quote dan Timeline — sebagai signature/penanda identitas, bukan dekorasi berulang.

Aturan ketat untuk motif ini:
- Tidak boleh dipakai lebih dari 2 kali dalam satu halaman.
- Ukurannya harus kecil dan halus — tidak boleh jadi focal point, hanya aksen di garis pemisah.
- Tidak boleh berbentuk kubah masjid, bulan sabit, atau simbol figuratif lain — murni geometris abstrak (garis & titik), konsisten dengan prinsip "editorial, minimal" di atas.
- Jika ragu apakah pemakaiannya sudah berlebihan, defaultnya adalah **tidak pakai** — section tanpa motif ini tetap sah dan tidak wajib selalu ada di setiap section.

### Konsistensi Kicker Label

Setiap section utama (quote, timeline, feature row, dsb.) sebaiknya konsisten memakai pola kicker label kecil di atas judul/isi, bukan hanya sebagian section — supaya ritme visual halaman terasa disengaja, bukan tertinggal di sebagian section saja.

### Alignment & Baseline Antar Kolom

Untuk layout multi-kolom (mis. timeline 4 tahapan), area kicker label harus punya tinggi tetap (reserved height, bukan mengikuti panjang teks) sehingga judul di tiap kolom selalu mulai dari baseline vertikal yang sama persis — detail kecil ini yang membedakan hasil "rapi" dari hasil "asal jadi".

### Struktur Layout Quote + Timeline (keputusan final)

- **Section digabung, bukan dipisah dua blok berjarak besar** — Quote dan Timeline adalah satu section kontinu (padding rapat di antara quote dan headline timeline), bukan dua section "minim" berturut-turut dengan jeda besar identik. Ini menghindari dua section berbobot visual sama persis muncul beruntun (lihat prinsip "Bobot visual section bervariasi" di atas).
- **Timeline 4 tahapan pakai grid 2x2 di desktop, bukan 1x4 sejajar.** Tiap kolom/kartu tipografis dapat ruang lebih luas untuk bernapas (whitespace internal besar), lebih berani dan tidak terasa renggang-tapi-kosong seperti 4 kolom sempit di layar ultra-wide.
- **Di mobile, Timeline berubah jadi timeline vertikal sungguhan** — bukan sekadar 4 blok teks bertumpuk tanpa penanda urutan. Hairline vertikal tipis di sisi kiri dengan angka 01-04 berjejer turun, tiap angka sejajar dengan judul & deskripsi tahapannya. Ini keputusan responsif eksplisit, bukan dibiarkan default framework menumpuk begitu saja.

## Ikon

- Gunakan satu set ikon konsisten (lihat `icon-size` di `design-tokens.json`: 16/20/24/32px).
- Ikon simbolik (Kaabah, bulan sabit, dsb.) dipakai secukupnya untuk penanda konteks (mis. label Waktu Sholat), bukan sebagai hiasan berulang di setiap card.

## Warna Aksen

- Emas (`accent`) dipakai hemat — untuk penekanan kecil (progress bar, highlight), bukan latar besar. Terlalu banyak emas membuat produk terasa seperti aplikasi finansial, bukan aplikasi refleksi spiritual.

## Referensi Kualitas

Apple Health, Notion, Linear, Headspace, Stoic, Reflect.app, Arc Browser — semua dipilih karena visualnya tenang dan fungsional, bukan dekoratif berlebihan. Ini standar yang dipakai untuk menilai apakah sebuah elemen visual "lolos" atau perlu disederhanakan lagi.

## Catatan dari Review Draft Landing Page (referensi historis)

Draft pertama landing page SLJ menunjukkan pola yang persis harus dihindari di atas: 4 mini-stat berikon-lingkaran di bawah hero, 4 feature card berbingkai dengan ikon lingkaran identik, timeline 4 tahapan pakai connector-line generik, dan 6 audience chip berbingkai dengan ikon person berulang — semua section punya bobot visual yang sama sehingga terasa monoton. Draft revisi mengganti pola ini dengan tipografi besar sebagai fokus utama, nomor tahapan tipografis tanpa connector line, dan section tanpa border kecuali untuk unit yang benar-benar butuh penekanan sebagai satu kesatuan.