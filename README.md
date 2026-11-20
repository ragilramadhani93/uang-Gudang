# Tracker Uang Operasional Harian Gudang (Android APK)

Aplikasi mobile Android (APK) mandiri (**Standalone & Zero-Backend**) untuk mengelola kas operasional harian armada & gudang (biaya Tol, BBM/Bensin, dan operasional rutin).

Aplikasi langsung membaca foto struk fisik menggunakan **Gemini Vision AI (Direct API)**, menyimpan data & foto ke database lokal HP (**expo-sqlite** & **expo-file-system**), serta mencetak dokumen resmi **1 Lembar Bukti Pengeluaran (BPG)** format PDF A4 siap cetak atau dibagikan ke WhatsApp / Email.

---

## 1. Aturan Keuangan & Data Pembuka (Imprest Fund)

Aplikasi menerapkan sistem kas kecil **Dana Tetap (Imprest)**:
- **Plafon Kas Kecil**: `Rp 2.000.000` (dapat diubah di menu Pengaturan).
- **Seed Database Otomatis Saat Pertama Kali Dibuka**:
  1. `2026-11-20` | No. Bukti: `-` | Kategori: `Plafon Awal` | Keterangan: *Modal awal kas kecil operasional gudang* | Masuk: `Rp 2.000.000` | Keluar: `Rp 0`
  2. `2026-11-20` | No. Bukti: `BPG-AWAL` | Kategori: `Penyesuaian` | Keterangan: *Pengeluaran berjalan sebelum tracker (selisih plafon vs cash on hand)* | Masuk: `Rp 0` | Keluar: `Rp 228.500`
- **Saldo Awal Riil**:
  - **Cash on Hand**: Tepat **`Rp 1.771.500`**
  - **Kebutuhan Reimburse**: Tepat **`Rp 228.500`**
- **Aturan Nomor Bukti Harian**:
  Semua pengeluaran Tol & Bensin pada tanggal yang sama otomatis memakai nomor bukti harian berformat:
  `BPG-YYYYMMDD-01` (contoh: `BPG-20261120-01`).

---

## 2. Fitur Utama & Desain

Gaya visual: **Tactile Industrial & Warm Swiss Utility** (bersih, kontras tinggi, garis border 1px yang tegas, angka `tabular-nums` rata kanan, tanpa neon gradient/glassmorphism berlebihan).

### Tab 1: Kas & Log Harian
- **Header Ringkas**: Menampilkan *Cash on Hand Saat Ini*, *Plafon*, dan *Kebutuhan Reimburse*.
- **Aksi Cepat**:
  - `SCAN STRUK`: Membuka kamera HP / galeri & ekstraksi instan dengan Gemini Vision.
  - `INPUT MANUAL`: Input pengeluaran jika struk hilang/tidak ada.
  - `TOP-UP KAS`: Catat dana reimburse masuk dari kasir/finance.
- **Buku Kas Real-Time**: Tanggal, No. Bukti, badge kategori (Tol, Bensin, Plafon Awal, Penyesuaian, Top-Up), Keterangan, Nominal, dan Saldo Berjalan (*running balance*).
- **Detail & Arsip Struk**: Ketuk baris untuk melihat detail lengkap dan foto fisik struk.

### Tab 2: Lembar Bukti Pengeluaran (PDF 1 Halaman A4)
- **Pemilih No. Bukti**: Pengelompokan transaksi berdasarkan nomor BPG harian.
- **Preview Dokumen Resmi**:
  - Header Dokumen: `LEMBAR BUKTI PENGELUARAN KAS KECIL OPERASIONAL GUDANG`
  - Nomor Bukti & Tanggal
  - Rincian Tabel Item Tol & Bensin (termasuk Plat Nomor & Rute armada)
  - Subtotal Tol, Subtotal Bensin, Total Bukti Pengeluaran
  - Sisa Cash on Hand Saat Ini
  - Blok tanda tangan 3 kolom: **Dibuat Oleh** (Admin/Supir), **Diperiksa Oleh** (Spv. Gudang), **Disetujui Oleh** (Finance/Manajer).
- **Export & Bagikan PDF**: Menghasilkan file PDF A4 standar dan membuka share dialog Android langsung ke **WhatsApp**, **Google Drive**, **Gmail**, atau **Printer**.

### Tab 3: Pengaturan
- **Gemini API Key**: Input dan simpan API Key di perangkat secara offline (tersimpan di AsyncStorage) dengan tombol *Tes Koneksi AI*.
- **Plafon Kas**: Sesuaikan batas plafon dana imprest.
- **Export Backup CSV**: Ekspor seluruh histori kas ke file CSV.
- **Reset Database**: Kembalikan data ke kondisi awal seed.

---

## 3. Konfigurasi Gemini Vision API

1. Dapatkan Gemini API Key gratis melalui Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Buka Tab **Pengaturan** di dalam aplikasi.
3. Tempel API Key Anda pada kolom **GEMINI VISION API KEY** lalu tekan **SIMPAN API KEY**.
4. Tekan **TES KONEKSI AI** untuk memastikan koneksi aktif.

*Catatan: API Key tersimpan di dalam perangkat HP pengguna, sehingga aplikasi tidak membutuhkan server perantara dan tetap dapat digunakan secara mandiri.*

---

## 4. Panduan Membangun (Build) APK Android

### A. Build Otomatis di GitHub Actions (Paling Praktis & Gratis)

Anda dapat membuat file `.apk` langsung menggunakan server gratis GitHub Actions tanpa perlu menginstal apapun di komputer:

1. **Buat Repository Baru di GitHub**:
   - Buka [github.com/new](https://github.com/new) dan buat repo baru (misal: `ops-gudang-tracker`).
2. **Push Kode Proyek ke GitHub**:
   ```bash
   git remote add origin https://github.com/<username-anda>/ops-gudang-tracker.git
   git branch -M main
   git push -u origin main
   ```
3. **Download File APK**:
   - Buka tab **Actions** di repositori GitHub Anda.
   - Workflow **"Build Android APK"** akan otomatis berjalan (atau tekan **Run workflow**).
   - Setelah proses selesai (sekitar 5-7 menit), klik hasil run tersebut.
   - Di bagian bawah (**Artifacts**), klik **`OPS-Gudang-Tracker-APK`** untuk mengunduh file `.apk` langsung ke HP atau komputer Anda!

---

### B. Build via EAS Cloud (Alternatif)

EAS Build memungkinkan Anda menghasilkan file `.apk` yang siap dipasang langsung ke HP tanpa perlu menginstal Android Studio atau SDK Java di komputer.

```bash
# 1. Login ke akun Expo (gratis)
npx eas-cli login

# 2. Inisialisasi konfigurasi proyek di EAS (jika baru pertama kali)
npx eas-cli project:init

# 3. Jalankan build APK dengan profil preview
npx eas-cli build -p android --profile preview
```

Setelah proses build selesai di cloud, terminal akan memberikan tautan unduhan langsung untuk file **`.apk`**. Unduh dan pasang di perangkat Android.

### C. Build APK Secara Lokal (Jika Android SDK & JDK Terpasang di Komputer)

```bash
# 1. Generate folder native Android
npx expo prebuild --platform android

# 2. Masuk ke folder android dan jalankan gradle assembleRelease
cd android
./gradlew assembleRelease

# File APK akan tersedia di:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Struktur Berkas Proyek

```
OPS Gudang/
├── App.tsx                     # Entry point & navigasi tab industrial
├── app.json                    # Konfigurasi package & izin Android
├── eas.json                    # Konfigurasi build APK
├── package.json
├── src/
│   ├── types/
│   │   └── index.ts            # Tipe data Transaction, Summary, OCR
│   ├── styles/
│   │   └── theme.ts            # Warna & tipografi Warm Swiss Utility
│   ├── database/
│   │   └── db.ts               # SQLite Imprest engine & initial seed
│   ├── services/
│   │   ├── gemini.ts           # Direct Gemini 2.5 Flash Vision OCR
│   │   ├── storage.ts          # Storage foto struk & preferensi
│   │   └── pdfGenerator.ts     # Generate & share PDF A4 1 halaman
│   ├── components/
│   │   ├── HeaderKas.tsx       # Kartu status Cash on Hand & Plafon
│   │   ├── QuickActionButtons.tsx # Tombol Scan, Manual, Top-Up
│   │   ├── TransactionItem.tsx # Baris transaksi dengan running balance
│   │   ├── ScanConfirmModal.tsx # Konfirmasi hasil scan struk
│   │   ├── ManualTransactionModal.tsx # Modal input manual / top-up
│   │   └── ReceiptViewModal.tsx # Pratinjau foto struk fisik
│   └── screens/
│       ├── KasLogScreen.tsx    # Tab 1: Kas & Log Harian
│       ├── LembarBuktiScreen.tsx # Tab 2: Lembar Bukti PDF A4
│       └── PengaturanScreen.tsx # Tab 3: Pengaturan & Backup
└── README.md
```

---

## 6. Verifikasi & Pengujian

- [x] **Database Seed**: Saldo awal tepat `Rp 1.771.500` dan Kebutuhan Reimburse `Rp 228.500`.
- [x] **Voucher Grouping**: Format otomatis `BPG-YYYYMMDD-01`.
- [x] **Gemini OCR**: Ekstraksi tanggal, kategori Tol/Bensin, keterangan, dan nominal Rupiah.
- [x] **Arsip Struk Lokal**: Tersimpan di sandbox document directory HP.
- [x] **PDF 1 Lembar A4**: Lengkap dengan rincian subtotal, sisa saldo kas fisik, dan 3 kolom tanda tangan.
- [x] **TypeScript**: Lolos `npx tsc --noEmit` tanpa error.
- [x] **Expo Doctor**: 20/20 lulus verifikasi integritas dependensi.
