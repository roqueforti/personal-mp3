# 🎵 SonicVault - Personal MP3 Music Player PWA

A high-performance, offline-ready Personal MP3 Music Player Progressive Web App (PWA) built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Web Audio API**.

Designed specifically for seamless phone playback, background audio continuation, lock-screen media controls, and zero server bandwidth cost (stores music directly in browser **IndexedDB**).

---

## ✨ Fitur Utama (Key Features)

- ☁️ **Sinkronisasi Multi-Device (Google Apps Script & Google Drive)**:
  - File MP3 yang di-upload dari HP atau Laptop otomatis tersimpan di **Google Drive pribadi kamu** via Google Apps Script Web App.
  - Metadata lagu & playlist tersimpan di **Google Sheets**.
  - Bebas kuota server cloud, gratis 100%, dan otomatis sinkron antar semua perangkat.
  - **Hybrid Caching**: Audio tetap di-cache di memori lokal HP (IndexedDB) setelah streaming/download sehingga tetap bisa diputar saat offline.
- 📱 **Mobile-First & PWA Standalone**:
  - Bisa diinstall langsung di Android (Chrome) & iOS (Safari "Add to Home Screen").
  - Berjalan seperti aplikasi native tanpa address bar browser.
- 🔒 **Lock Screen & Background Audio (Media Session API)**:
  - Musik tetap berputar meskipun layar HP terkunci (*locked*) atau saat membuka aplikasi lain.
  - Tampilan cover art, judul lagu, dan nama artis di Lock Screen HP.
  - Kontrol media lengkap di Notification & Lock Screen: Play, Pause, Previous, Next, Seekbar scrub.
- 🚀 **Bebas Upload Musik (Zero Cloud Server Cost)**:
  - File MP3/M4A/FLAC/WAV/OGG disimpan langsung di memori perangkat (**IndexedDB**).
  - Privasi 100% aman (musik tidak pernah di-upload ke server publik).
  - Siap di-deploy langsung di **Vercel** secara gratis.
- 🎨 **Tampilan Full React (Non-Glassmorphic Solid Dark Theme)**:
  - Desain solid, tajam, modern dengan palet deep charcoal, slate, dan aksen indigo/emerald.
  - Tidak menggunakan efek blur/glassmorphism yang berat di HP.
  - Safe-area inset support untuk Dynamic Island dan notch HP modern.
- 🎚️ **5-Band Web Audio Graphic Equalizer**:
  - 60Hz (Sub-bass), 230Hz (Bass), 910Hz (Mid), 3.6kHz (High-Mid), 14kHz (Treble).
  - Presets: *Flat, Bass Boost, Bass Reducer, Vocal Boost, Treble Boost, Rock, Pop, Electronic, Acoustic*.
  - Real-time frequency visualizer canvas.
- 🌙 **Sleep Timer dengan Fade-Out**:
  - Pilihan waktu: 5m, 15m, 30m, 45m, 60m, 90m, atau *Berhenti di akhir lagu ini*.
  - Mengurangi volume secara halus sebelum berhenti otomatis saat kamu tidur.
- 📑 **Playlist & Antrean (Queue)**:
  - Buat playlist kustom tanpa batas.
  - Fitur Lagu Favorit (❤️).
  - Pencarian instan (search filter) & mode shuffle / repeat (Off / All / One).
  - Pengatur kecepatan putar (*Playback Speed*: 0.75x, 1x, 1.25x, 1.5x, 2x).

---

## 🚀 Cara Menjalankan Secara Lokal (Local Development)

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser atau akses dari IP HP kamu di jaringan WiFi yang sama.

---

## 🌐 Cara Deploy ke Vercel (Online Ready)

1. Push repository ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan klik **Add New Project**.
3. Import repository GitHub kamu.
4. Klik **Deploy**! (Semua konfigurasi Next.js 14 sudah otomatis optimal untuk Vercel).

---

## 📱 Cara Install di HP (PWA)

### Android (Chrome / Samsung Internet):
1. Buka URL website di Chrome.
2. Ketuk banner **Install** yang muncul di atas layar (atau ketuk menu titik tiga ⋮ -> *Install App / Tambahkan ke Layar Utama*).

### iOS (iPhone / iPad Safari):
1. Buka URL website di Safari.
2. Ketuk tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah layar).
3. Gulir ke bawah dan pilih **"Add to Home Screen"** (Tambah ke Layar Utama).
