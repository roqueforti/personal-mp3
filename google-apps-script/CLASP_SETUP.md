# 🚀 Panduan Setup CI/CD Google Apps Script (CLASP + GitHub Actions)

Panduan ini memungkinkan Anda melakukan **otomatisasi deployment** kode Google Apps Script setiap kali melakukan `git push` ke GitHub menggunakan **CLASP** (`@google/clasp`) dan **GitHub Actions**.

---

## 📋 Langkah 1: Aktifkan Google Apps Script API

1. Buka [**script.google.com/home/usersettings**](https://script.google.com/home/usersettings).
2. Ubah toggle **Google Apps Script API** menjadi **ON** (Aktif).

---

## 🔑 Langkah 2: Login CLASP & Ambil Token Kredensial

Jalankan perintah berikut di terminal komputer Anda:

```bash
npx @google/clasp login
```

- Browser akan terbuka meminta izin login ke akun Google Anda.
- Setelah login berhasil, file token autentikasi akan tersimpan di komputer Anda di path:
  - **Windows**: `C:\Users\<Username>\.clasprc.json`
  - **Mac / Linux**: `~/.clasprc.json`

Buka file `.clasprc.json` tersebut dengan Text Editor (Notepad / VSCode) dan salin seluruh isinya.

---

## 🆔 Langkah 3: Dapatkan Script ID & Deployment ID Proyek Anda

1. Buka project Google Apps Script Anda di [script.google.com](https://script.google.com/).
2. Klik ikon **Project Settings** ⚙️ (di menu sebelah kiri).
3. Salin **Script ID** (misal: `1abcxyz123...`).
4. *(Opsional)* Untuk memperbarui deployment Web App yang sudah ada tanpa mengubah link URL-nya:
   - Klik **Deploy** ➔ **Manage deployments**.
   - Salin **Deployment ID** (misal: `AKfycbx...`).

---

## 🔒 Langkah 4: Masukkan Secrets di GitHub Repository

1. Buka repository GitHub Anda di browser: [**github.com/roqueforti/personal-mp3**](https://github.com/roqueforti/personal-mp3).
2. Masuk ke menu **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Klik **New repository secret** dan tambahkan secret berikut:

| Nama Secret | Nilai (Value) |
|---|---|
| `SCRIPT_ID` | **Script ID** dari Langkah 3 (Wajib) |
| `CLASPRC_JSON` | Seluruh isi file **`.clasprc.json`** dari Langkah 2 (Wajib) |
| `DEPLOYMENT_ID` | *(Opsional)* **Deployment ID** dari Langkah 3 agar URL Web App tetap sama |

---

## ⚡ Langkah 5: Selesai & Cara Kerja Otomatis!

Sekarang CI/CD sudah aktif!
- Setiap kali Anda mengedit file di folder `google-apps-script/Code.gs` lalu melakukan:
  ```bash
  git add .
  git commit -m "update backend logic"
  git push
  ```
- **GitHub Actions** akan otomatis berjalan:
  1. Menyiapkan autentikasi CLASP.
  2. Melakukan `clasp push --force` untuk memperbarui kode di Google Apps Script.
  3. Melakukan `clasp deploy` untuk merilis versi Web App terbaru secara instan tanpa perlu buka browser!

---

## 💻 Perintah Lokal (Opsional)

Jika ingin push / deploy langsung dari terminal komputer Anda:

```bash
# Push kode ke Google Apps Script
npm run gas:push

# Deploy versi baru Web App
npm run gas:deploy

# Buka project di browser
npm run gas:open
```
