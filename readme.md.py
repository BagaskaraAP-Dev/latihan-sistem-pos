Buatkan aplikasi web full-stack **Sistem Kasir (POS) & Manajemen Stok UMKM**. Alur dan tata letak layar kasirnya meniru POS minimarket waralaba Indonesia seperti Indomaret/Alfamart: scan dulu, keyboard lebih penting daripada mouse, tabel baris belanja, dan TOTAL yang besar. Seluruh teks dalam bahasa Indonesia, uang dalam Rupiah (`Rp 15.000`, tanpa desimal), waktu dalam WIB (Asia/Jakarta). Aplikasi berjalan di atas **Docker Compose multi-container**.

Yang ditiru hanya **alur kerja dan tata letaknya**. Jangan pakai nama, logo, maskot, atau kombinasi warna khas Indomaret/Alfamart. Nama toko diambil dari env `STORE_NAME` (default: `TOKO SERBA ADA`).

## Stack (sudah ditetapkan)
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL 16 dengan driver `pg` (node-postgres) dan query SQL berparameter. Tanpa Prisma, untuk menghindari masalah binary engine/OpenSSL di Alpine.
- `qrcode` untuk QR simulasi
- Node.js LTS yang didukung Next.js terbaru (pastikan lewat context7)
- Tanpa UI kit siap pakai (shadcn, MUI, DaisyUI, dsb.). Komponen dibuat sendiri dengan Tailwind.

## Panduan UI/UX (wajib dipatuhi)

### Karakter visual
Terminal kasir yang serius dan cepat dibaca dari jarak 60–80 cm. Rapat, kontras tinggi, tanpa hiasan.
- Tema gelap netral: latar `#0f1115`, panel `#171a21`, garis `#2a2f3a`, teks utama `#e6e8eb`, teks sekunder `#9aa3b2`.
- Hanya **satu warna aksen** untuk aksi utama dan fokus. Warna status dipakai khusus untuk statusnya: hijau = lunas/berhasil, kuning = stok menipis, merah = stok habis/hapus/batal.
- Font: satu sans-serif yang bersih (mis. IBM Plex Sans atau Inter) untuk label, dan satu monospace (mis. IBM Plex Mono / JetBrains Mono) untuk **semua angka, kode, dan struk**. Pakai `tabular-nums`, dan angka uang selalu rata kanan.
- Radius kecil (4–6px), border 1px, tanpa bayangan tebal.

### Larangan "AI slop"
Jangan pakai:
- gradien ungu/biru/pink
- glassmorphism atau backdrop blur
- glow atau shadow besar
- `rounded-2xl`/`rounded-3xl`
- emoji di UI
- ilustrasi atau hero section
- kartu besar dengan ikon dalam lingkaran berwarna
- animasi dekoratif (bounce, shimmer, partikel)
- teks marketing ("Kelola bisnismu lebih mudah 🚀")
- lorem ipsum
- greeting di dashboard
- grid kartu produk bergambar di halaman kasir

Animasi hanya transisi ≤150ms untuk fokus dan modal. Microcopy harus pendek dan operasional, seperti di mesin kasir: "Scan / ketik kode barang", "Stok tidak cukup", "Kembali", "Transaksi tersimpan".

### Tata letak Halaman Kasir (`/`), layar ≥1280px
- **Header tipis**: nama toko, nomor kasir (`KASIR 01`), nama kasir, tanggal dan jam berjalan (WIB), nomor transaksi berikutnya.
- **Kiri (±70%)**:
  - Kolom input **Scan / Kode Barang** di atas, selalu fokus.
  - Di bawahnya tabel baris belanja dengan kolom `No | Kode | Nama Barang | Qty | Harga | Subtotal`. Baris terpilih di-highlight, dan baris terbaru otomatis terlihat (auto-scroll).
- **Kanan (±30%)**:
  - Panel **TOTAL** dengan angka sangat besar (monospace, ≥56px).
  - Di bawahnya jumlah item dan jumlah qty.
  - Info barang terakhir yang di-scan (nama, harga, qty).
  - Tombol bayar.
- **Footer**: bar fungsi seperti mesin kasir, berisi label tombol pintas: `F2 Cari Barang · F4 Ubah Qty · Del Hapus Baris · F8 Batal Transaksi · F9 Bayar Tunai · F10 Bayar QRIS · Esc Tutup`.

### Interaksi (keyboard-first)
- Input scan menerima kode SKU atau barcode lalu **Enter** (barcode scanner USB bekerja seperti keyboard). Jika barang sudah ada di tabel, qty-nya bertambah; jika belum, baris baru ditambahkan.
- Pola pengali: ketik `3*` lalu scan/ketik kode, maka barang masuk dengan qty 3.
- Kode tidak ditemukan: tampilkan pesan merah singkat di bawah input, beri efek getar kecil pada input, kosongkan input, dan fokus tetap di input.
- `↑`/`↓` memilih baris. `F4` mengubah qty baris terpilih lewat modal kecil berisi input angka. `Del` menghapus baris dengan konfirmasi `Y/N`. `F8` membatalkan seluruh transaksi dengan konfirmasi.
- `F2` membuka modal **Cari Barang**: pencarian nama/kode dengan filter kategori, hasil berupa tabel (kode, nama, harga, stok), navigasi dengan panah, dan Enter untuk memilih.
- `F9` Tunai: modal berisi total dan input "Bayar" (angka diformat ribuan otomatis saat diketik), tombol cepat `Uang Pas | 20.000 | 50.000 | 100.000`, kembalian tampil besar. Enter menyimpan; tombol simpan nonaktif jika bayar < total.
- `F10` QRIS: modal dengan QR dari string dummy (nomor invoice + total), label jelas **"SIMULASI — bukan QRIS asli"**, nominal tagihan, dan tombol "Konfirmasi Lunas".
- Setelah modal apa pun ditutup, fokus **selalu kembali** ke input scan.
- Gunakan `preventDefault` untuk tombol pintas, tapi jangan pakai F5, F11, atau F12.
- Semua aksi yang bisa dilakukan lewat keyboard juga harus bisa diklik.
- **Layar pelanggan** `/display`: halaman terpisah untuk monitor kedua yang menampilkan barang terakhir, daftar belanja, dan TOTAL besar. Halaman ini sinkron real-time dengan kasir lewat `BroadcastChannel`, dan setelah transaksi selesai menampilkan "Terima kasih".

### Struk
Struk thermal 80mm, seluruhnya monospace dengan lebar ±42 karakter:
- Header: nama toko, alamat (env `STORE_ADDRESS`), garis `-----`.
- Info transaksi: nomor invoice, tanggal/jam, kasir.
- Per item: nama barang di satu baris, lalu `qty x harga` dengan subtotal rata kanan di baris berikutnya.
- Garis pemisah, lalu `TOTAL`, `TUNAI`/`QRIS`, `KEMBALI`, dan jumlah item.
- Penutup: "Terima kasih, selamat belanja kembali".

Tombol Cetak memakai `@media print`, sehingga hanya struk yang tercetak, tanpa margin browser.

### Halaman lain
- `/products` dan `/reports` memakai bahasa visual yang sama: tabel rapat, header tabel sticky, kolom angka rata kanan, pencarian di atas tabel, tanpa kartu dekoratif.
- Navigasi antarhalaman lewat bar atas yang sederhana: `Kasir | Produk | Laporan`.

## Langkah kerja

### 1. Perencanaan (`sequential-thinking` MCP)
Sebelum menulis kode, buat rancangan lalu tulis di `docs/ARCHITECTURE.md`:
- arsitektur 3 container (`pos-web`, `pos-db`, `pos-adminer`)
- skema tabel
- alur checkout atomik
- peta tombol pintas
- struktur folder

### 2. Validasi dokumentasi (`context7` MCP)
Cek dokumentasi terbaru untuk:
- Next.js: App Router, `output: 'standalone'`, Route Handlers/Server Actions, `next/font`
- Tailwind CSS: setup versi terbaru (v4 berbeda dari v3)
- `pg`

Pakai hanya API yang tidak deprecated, lalu catat versi yang dipakai.

### 3. Aturan data & keamanan transaksi
- Semua nominal uang disimpan sebagai `INTEGER` (rupiah utuh).
- `products`: `id`, `sku` (UNIQUE), `barcode` (UNIQUE, nullable, EAN-13), `name`, `category`, `cost_price`, `sell_price`, `stock` (CHECK ≥ 0), `is_active`, `created_at`, `updated_at`.
- `transactions`: `id`, `invoice_no` (UNIQUE, format `INV-YYYYMMDD-XXXX`), `cashier_name`, `total`, `payment_method` (`TUNAI` | `QRIS`), `amount_paid`, `change_amount`, `created_at`.
- `transaction_items`: `id`, `transaction_id` (FK), `product_id` (FK), `product_name`, `qty`, `cost_price`, `sell_price`, `subtotal`. Nama dan harga disalin (snapshot) saat transaksi.
- Checkout berjalan di server dalam satu transaksi database:
  1. `BEGIN`.
  2. Kunci baris produk dengan `SELECT … FOR UPDATE`.
  3. Ambil harga dari database, jangan percaya harga dari client.
  4. Jika stok kurang, `ROLLBACK` dan tampilkan pesan yang menyebut nama barangnya.
  5. Untuk tunai, tolak jika bayar < total.
  6. Kurangi stok, simpan transaksi beserta itemnya, lalu `COMMIT`.
- Produk yang sudah pernah terjual tidak dihapus permanen, cukup dinonaktifkan (`is_active = false`).

### 4. Fitur halaman
**Kasir (`/`)**: ikuti Panduan UI/UX di atas.

**Manajemen Produk (`/products`)**
- CRUD (SKU, barcode, nama, kategori, harga modal, harga jual, stok) dengan validasi: SKU/barcode unik, nilai tidak negatif, peringatan jika harga jual < harga modal.
- Kolom stok diberi penanda: kuning jika < 5, merah jika 0.
- Filter cepat "Stok menipis".

**Laporan (`/reports`)**
- Ringkasan dalam satu baris stat (bukan kartu besar): Total Omzet, Jumlah Transaksi, Estimasi Laba Kotor (Σ (harga jual − harga modal) × qty dari snapshot item).
- Filter rentang tanggal (default: hari ini, WIB).
- Tabel riwayat transaksi yang bisa dibuka untuk melihat detail item, plus tombol cetak ulang struk.

**Inisialisasi database & seeding**
- Saat container `pos-web` start, sebelum server jalan, script idempoten membuat tabel dengan `CREATE TABLE IF NOT EXISTS`.
- Jika tabel `products` kosong, isi ±15 produk minimarket yang realistis, misalnya beras 5 kg, minyak goreng 2 L, gula 1 kg, mi instan, air mineral 600 ml, telur, kopi sachet, susu UHT, sabun mandi, pasta gigi, dan deterjen. Gunakan harga Rupiah yang wajar, barcode EAN-13 dummy berawalan `899` dengan check digit valid, dan beberapa produk dengan stok < 5.
- Halaman yang membaca database dirender dinamis (`export const dynamic = 'force-dynamic'` atau setara), supaya `docker build` tidak mencoba konek ke database.

### 5. Docker
- `Dockerfile` multi-stage (deps → build → runner) berbasis Node Alpine:
  - memakai `output: 'standalone'`
  - install dependensi dengan `npm ci` dari `package-lock.json`
  - berjalan sebagai user non-root
- `docker-compose.yml`:
  - `pos-web`: port `3000:3000`; `depends_on` ke `pos-db` dengan `condition: service_healthy`; `DATABASE_URL` mengarah ke host `pos-db`; env `STORE_NAME`, `STORE_ADDRESS`, `CASHIER_NAME`; healthcheck ke `GET /api/health`.
  - `pos-db`: `postgres:16-alpine`, healthcheck `pg_isready`, volume `pgdata`, port tidak dibuka ke host.
  - `pos-adminer`: `adminer`, port `8080:8080`.
  - Kredensial dibaca dari `.env`; sediakan juga `.env.example`.
- `.dockerignore`: `node_modules`, `.next`, `.git`, `.env`.
- `.gitignore`: abaikan `.env`, tapi tetap ikutkan `.env.example`.
- Jalankan `docker compose up -d --build`. Kalau ada yang gagal, baca `docker compose logs`, perbaiki, lalu ulangi sampai semua container healthy/running.

### 6. Uji end-to-end (`playwright` MCP)
Pasang `data-testid` di elemen penting. Setelah `http://localhost:3000` aktif:
1. Buka kasir dan pastikan tidak ada console error, serta input scan langsung fokus.
2. Catat stok awal 2 produk. Ketik kode produk A lalu Enter. Ketik `2*` + kode produk B lalu Enter. Pastikan tabel berisi 2 baris, qty B = 2, dan TOTAL benar.
3. Ketik kode yang tidak ada dan pastikan pesan error muncul serta fokus tetap di input.
4. Tekan `F9`, isi bayar, lalu Enter. Pastikan struk muncul dengan kembalian yang benar dan fokus kembali ke input scan.
5. Buka `/products` dan pastikan stok A berkurang 1 dan B berkurang 2.
6. Buka `/reports` dan pastikan transaksi baru tercatat dengan total yang benar.
7. Ulangi satu transaksi dengan `F10` (QRIS simulasi).
8. Isi keranjang dengan 3–4 barang, lalu ambil screenshot full-page di viewport 1440×900 dan simpan sebagai `review-preview.png` di root proyek (salin ke root jika MCP menyimpannya di tempat lain).
9. Tinjau screenshot tersebut terhadap daftar "Larangan AI slop" dan perbaiki pelanggaran yang ditemukan sebelum melapor.

### 7. Kesiapan Git
- Pakai git CLI lokal: jalankan `git init` jika repo belum ada, pastikan `.env`, `node_modules`, dan `.next` tidak ter-track, lalu tampilkan `git status`.
- Jangan commit atau push. `github` MCP baru dipakai kalau nanti saya minta membuat repo remote.

## Aturan umum
- Jika salah satu MCP tidak tersedia, sebutkan, lalu lanjutkan dengan cara lain.
- Jangan tinggalkan TODO atau placeholder.

## Laporan akhir
Tampilkan:
1. Pohon struktur file (tanpa `node_modules` dan `.next`).
2. Output `docker compose ps`.
3. Hasil tiap langkah uji Playwright (lulus/gagal), termasuk stok sebelum dan sesudah.
4. Lokasi `review-preview.png`.
5. Output `git status`.
6. Daftar tombol pintas dan URL akses: kasir http://localhost:3000, layar pelanggan http://localhost:3000/display, Adminer http://localhost:8080 (server: `pos-db`).