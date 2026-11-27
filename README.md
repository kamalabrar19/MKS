# Ruang Angka

Aplikasi React + Vite untuk eksplorasi numerologi Pythagoras berdasarkan booklet Workshop Numerology Pythagoras oleh Rudy Gunawan (101 halaman).

## Menjalankan

Gunakan Node.js 18 atau lebih baru (Node.js 22 LTS dianjurkan).

```powershell
cd D:\MKS\ruang-angka
npm install
npm run dev
```

Buka URL lokal dari Vite. Build produksi: `npm run build`. Pratinjau build: `npm run preview`. Pengujian rumus: `npm test`.

## Fitur

- Empat Life Core dengan bobot 40/30/20/10, tema dominan, Strong Number.
- Perhitungan nama per kata; vokal A/I/U/E/O dan konsonan, Master dan Karmic.
- Personality, Attitude, Growth, Maturity, angka hadir dan Karmic Lesson.
- Life Cycle, empat Pinnacle dan Challenge, Personal Year yang dapat dipilih.
- Perbandingan pasangan per posisi dan matriks harmoni 9×9 dari booklet.
- Panduan, transparansi perhitungan, dan cetak hasil lewat browser.

## Ringkasan AI internal

Website ini hanya untuk penggunaan lokal/internal, tidak dipublikasikan. Server Vite terikat ke `127.0.0.1`. Jangan memakai `--host 0.0.0.0`, tunnel publik, atau mengunggah folder proyek beserta file rahasianya.

Kunci Gemini disimpan di `.env.local` sebagai `GEMINI_API_KEY`. Jika menyiapkan instalasi baru, salin `.env.example` menjadi `.env.local`, isi kunci, lalu mulai ulang server. Jangan memakai awalan `VITE_` untuk kunci. File rahasia diabaikan Git dan tidak masuk bundle browser.

Hitung profil, kemudian tekan **Ringkas dengan AI** pada tab Profil diri. Model yang dipakai: `gemini-3.1-flash-lite`, melalui `generateContent`. Endpoint `/api/summary` tersedia pada `npm run dev` maupun `npm run preview`; membuka `dist/index.html` langsung tidak menjalankan backend AI.

Perhitungan tetap deterministik di browser; AI hanya menjelaskan hasil numerik. Payload ke Gemini tidak memuat nama, tanggal lahir, atau susunan huruf nama. Konteks berisi ringkasan metode dan tema yang bersumber dari booklet, bukan keseluruhan PDF. Gemini dapat keliru; angka hasil aplikasi tetap menjadi acuan. Ringkasan tidak disimpan ke disk atau database dan hilang saat profil ditutup/diganti.

Gunakan proyek Google AI Studio **Free tier**, tanpa billing berbayar. Ketersediaan model dan kuota gratis ditentukan Google. Tidak ada parameter API yang memaksa suatu panggilan menjadi gratis bila proyek sudah berada di tier berbayar. Aplikasi tidak mengaktifkan billing, tidak melakukan retry otomatis, dan tidak berpindah model saat kuota habis. Pada Free tier, konten dapat digunakan Google untuk meningkatkan produknya. Lihat https://ai.google.dev/gemini-api/docs/pricing.

Jika koneksi gagal, perhitungan lokal tetap tersedia dan panel AI menampilkan pesan kesalahan. Error 429 berarti batas kuota/permintaan; 401/403 berarti kunci/izin proyek perlu diperiksa. Jangan membagikan `.env.local`.

Numerologi merupakan interpretasi simbolik, bukan asesmen ilmiah atau prediksi. Panduan aplikasi mencatat keputusan metode untuk contoh booklet yang tidak konsisten. Essence Year belum termasuk dalam cakupan aplikasi.


## Pembaruan alur otomatis

Nama diisi dalam tiga field (depan wajib; tengah dan akhir opsional). Perhitungan sinkron tetap menggunakan nama lengkap gabungan per kata. Setelah hasil tampil, ringkasan Gemini otomatis dimulai dengan streaming NDJSON dari endpoint lokal; tidak ada identitas yang dikirim. Permintaan aktif tetap berjalan saat berpindah tab dan hasil disimpan sementara dalam memori halaman. Prompt dipersingkat menjadi 200–300 kata dengan keluaran dibatasi; waktu jaringan dan waktu respons penyedia tetap berlaku.

Tombol Export PDF tampil setelah ringkasan lengkap selesai. Dialog cetak menyediakan Simpan sebagai PDF, dengan laporan A4 terpisah berisi tiga bagian nama, tanggal lahir, tahun analisis, Life Core, indikator, Strong Number, Karmic Lesson, siklus, Pinnacle/Challenge, konversi nama dan teks AI. Tidak perlu mencetak tab satu per satu. Animasi menghormati preferensi reduced motion.

Model dipatok ke gemini-3.1-flash-lite sesuai integrasi yang sudah dipakai pengguna. thinkingLevel=minimal meminimalkan thinking untuk ringkasan ini. Batas keluaran 1536 token; streaming tetap aktif. Akses model dan kuota tetap mengikuti proyek Google.

Verifikasi langsung: model 2.5 menolak pengguna baru (404); 3.8 mengembalikan 503. Model 3.1 Flash-Lite berhasil menghasilkan teks dengan kunci proyek ini.

## Prompt ringkasan

Edit `prompt_rules.txt` di akar proyek untuk mengubah gaya feedback. Backend membaca file ini setiap permintaan baru (tanpa restart). Output diarahkan menjadi 100–140 kata dalam tiga paragraf dengan bahasa hangat, tidak menghakimi, dan tanpa diagnosis. Ringkasan yang sudah ada tetap tersimpan sementara; klik Buat ulang ringkasan setelah mengubah prompt. Sertakan file TXT saat memindahkan proyek, termasuk saat memakai npm run preview.
