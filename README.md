# Latihan Sistem Kasir (POS) & Manajemen Stok UMKM

Proyek ini adalah repositori latihan saya, Bagaskara Amukti Palapa, dalam merancang dan membangun sistem kasir ritel (Point of Sale) modern yang terinspirasi dari tata letak operasional kasir minimarket di Indonesia.

Fokus utama latihan ini adalah memahami alur checkout yang cepat, keandalan transaksi database (atomisitas dan penanganan stok), antarmuka kasir yang nyaman digunakan dengan pemindai barcode, serta arsitektur multi-container menggunakan Docker.

---

## 1. Arsitektur & Teknologi

Aplikasi dibangun menggunakan susunan teknologi berikut:

- Antarmuka & Backend: Next.js (App Router) dengan TypeScript dan Tailwind CSS.
- Basis Data: PostgreSQL 16 menggunakan driver node-postgres (`pg`) tanpa ORM berat, untuk menjaga performa query dan stabilitas build pada Alpine Linux.
- Kontainerisasi: Docker Compose multi-container dengan tiga layanan terisolasi dalam satu jaringan bridge:
  - `pos-web`: Layanan web Next.js pada port 3000.
  - `pos-db`: Basis data PostgreSQL 16 dengan volume data persisten pada port 5432.
  - `pos-adminer`: Antarmuka administrasi basis data visual pada port 8080.
- Komunikasi Real-time: `BroadcastChannel` API di browser untuk sinkronisasi tanpa server antara terminal kasir dan layar monitor pelanggan kedua (`/display`).

---

## 2. Fitur yang Diimplementasikan

### Terminal Kasir (`/`)
- Desain antarmuka modular: tata letak katalog produk ritel di sisi kiri dan ringkasan keranjang belanja di sisi kanan.
- Dukungan pemindai barcode USB dan input SKU langsung.
- Pola pengali kuantitas: kasir dapat mengetik pola angka seperti `3*BRG-001` untuk langsung menambahkan barang dengan kuantitas 3.
- Tombol akses cepat:
  - F2: Fokus langsung ke kolom pencarian atau pemindaian barcode.
  - F9: Pembayaran tunai dengan perhitungan kembalian instan.
  - F10: Simulasi pembayaran QRIS dinamis.
  - Esc: Menutup jendela modal aktif.
- Modal tambah barang langsung dari halaman kasir tanpa harus berpindah halaman.
- Pencetakan struk belanja format thermal 80mm dengan CSS `@media print`.

### Layar Pelanggan (`/display`)
- Halaman mandiri yang diperuntukkan bagi monitor kedua yang menghadap ke pelanggan.
- Menampilkan rincian barang terakhir yang dipindai, daftar belanjaan, dan total akhir dengan angka berukuran besar.
- Sinkron otomatis saat kasir memindai barang atau menyelesaikan transaksi.

### Manajemen Produk (`/products`)
- Pengelolaan katalog produk lengkap: SKU, nama barang, kategori, harga modal, harga jual, dan stok gudang.
- Validasi margin keuntungan: sistem memberikan peringatan jika harga jual lebih rendah dari harga modal (kondisi rugi).
- Tombol cepat penambahan stok fisik (+5 unit) dan penanda visual untuk stok yang menipis di bawah 5 unit.

### Rekap Laporan (`/reports`)
- Ringkasan indikator performa: Total Omzet, Jumlah Transaksi, dan Estimasi Laba Kotor.
- Riwayat transaksi terperinci yang dapat diperluas untuk melihat barang per nota.
- Tombol cetak ulang struk untuk transaksi lama.

---

## 3. Keamanan & Integritas Transaksi

Untuk mencegah inkonsistensi data dan selisih stok (race condition) saat kasir memproses transaksi bersamaan:
1. Setiap transaksi checkout dibungkus dalam blok `BEGIN ... COMMIT` database.
2. Baris produk dikunci sementara menggunakan klausul `SELECT ... FOR UPDATE`.
3. Validasi stok dilakukan langsung di level basis data. Jika stok fisik tidak mencukupi, transaksi otomatis dibatalkan (`ROLLBACK`).
4. Data barang pada `transaction_items` disimpan sebagai snapshot (nama, harga modal, dan harga jual saat transaksi berlangsung) agar laporan keuangan masa lalu tidak berubah ketika harga katalog diperbarui.

---

## 4. Cara Menjalankan Proyek

### Prasyarat
- Docker Desktop yang sudah aktif di komputer Anda.
- Git.

### Langkah Instalasi
1. Klon repositori ini ke komputer lokal:
   ```bash
   git clone https://github.com/BagaskaraAP-Dev/latihan-sistem-pos.git
   cd latihan-sistem-pos
   ```

2. Siapkan file konfigurasi environment:
   ```bash
   cp .env.example .env
   ```

3. Jalankan aplikasi menggunakan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

4. Akses melalui browser:
   - Kasir Utama: http://localhost:3000
   - Layar Pelanggan: http://localhost:3000/display
   - Manajemen Stok: http://localhost:3000/products
   - Rekap Laporan: http://localhost:3000/reports
   - Database Adminer: http://localhost:8080 (Server: `pos-db`, Pengguna: `posuser`, Sandi: `pospassword`, Database: `pos_db`)

---

## 5. Struktur Folder

```text
├── public/                 # Asset statis publik
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API Route Handlers (products, transactions, reports, health)
│   │   ├── display/        # Halaman Layar Pelanggan
│   │   ├── products/       # Halaman Manajemen Stok & Produk
│   │   ├── reports/        # Halaman Laporan Penjualan
│   │   ├── layout.tsx      # Root layout aplikasi
│   │   └── page.tsx        # Halaman Kasir Utama
│   ├── components/         # Komponen UI (Navbar, Modals, ProductIcon, dsb)
│   ├── lib/                # Koneksi database pg dan utilitas format mata uang
│   └── types/              # Definisi TypeScript interface
├── Dockerfile              # Multi-stage production build Next.js
├── docker-compose.yml      # Orkestrasi container pos-web, pos-db, pos-adminer
├── .env.example            # Contoh variabel environment
└── README.md               # Dokumentasi proyek
```

---

Dibuat oleh Bagaskara Amukti Palapa sebagai dokumentasi proses belajar pengembangan aplikasi kasir ritel full-stack.
