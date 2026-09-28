# SPESIFIKASI WEBSITE — RECEIPT / INVOICE MANAGER

## 1. TUJUAN WEBSITE

### Website ini buat apa?

Website ini adalah **aplikasi manajemen struk dan invoice berbasis lokal (localhost)** yang digunakan untuk mengelola produk, pelanggan, pesanan, penjualan, invoice, serta membuat dan mencetak struk secara fleksibel.

Fokus utama aplikasi adalah menyediakan sistem kasir/invoice sederhana tetapi lengkap, dengan kemampuan untuk:

* Mengelola data produk
* Mengelola pelanggan
* Membuat pesanan
* Mengelola transaksi penjualan
* Membuat nomor invoice otomatis
* Mencetak struk
* Mencetak ulang struk transaksi lama
* Mendesain tampilan struk secara fleksibel
* Mengatur logo, teks, ukuran, warna, posisi, dan urutan elemen struk
* Mendukung printer thermal 58mm dan 80mm
* Menyimpan seluruh data secara permanen pada database lokal

Aplikasi harus berupa **aplikasi siap pakai**, bukan sekadar prototype UI.

### Jenis website

**Local Business Management / POS / Receipt & Invoice Management Application**

### Target pengguna

Target pengguna adalah:

* Pemilik usaha
* Kasir
* Admin usaha
* Toko kecil dan menengah
* Usaha yang menggunakan printer thermal untuk mencetak struk

### Public atau user tertentu?

Aplikasi ini merupakan **aplikasi internal/local**.

Tidak ditujukan sebagai website publik.

Aplikasi dijalankan dari laptop/PC menggunakan:

```text
http://localhost:5173
```

Tidak membutuhkan cloud hosting atau database online untuk fungsi utamanya.

---

# 2. FITUR UTAMA

## Dashboard

Dashboard menampilkan data aktual dari database:

* Total penjualan hari ini
* Jumlah transaksi hari ini
* Total penjualan bulan ini
* Pesanan pending
* Rata-rata transaksi
* Produk terlaris
* Transaksi terbaru
* Grafik penjualan

Filter grafik:

* Hari ini
* 7 hari
* 30 hari
* Bulan ini
* Custom tanggal

---

## Pesanan

Fitur untuk membuat dan mengelola pesanan.

Fungsi:

* Membuat pesanan baru
* Memilih pelanggan
* Menambahkan produk
* Mengatur jumlah produk
* Mengatur harga
* Menghapus item
* Diskon
* Pajak
* Biaya tambahan
* Menghitung subtotal
* Menghitung grand total
* Mengubah status pesanan

Status:

```text
Draft
Menunggu Pembayaran
Diproses
Selesai
Dibatalkan
```

---

## Penjualan

Digunakan untuk melihat transaksi yang telah dilakukan.

Menampilkan:

* Nomor invoice
* Tanggal
* Pelanggan
* Total transaksi
* Metode pembayaran
* Status

Fungsi:

* Lihat detail
* Cetak struk
* Cetak ulang struk
* Search
* Filter tanggal
* Filter status
* Filter metode pembayaran

Metode pembayaran:

```text
Cash
Transfer
QRIS
Debit
Credit
Other
```

---

## Produk

CRUD lengkap:

* Tambah produk
* Lihat produk
* Edit produk
* Nonaktifkan produk
* Search
* Filter
* Sort

Data:

```text
Kode Produk
Nama Produk
Kategori
Harga
Satuan
Deskripsi
Gambar
Status
```

---

## Pelanggan

CRUD lengkap:

* Tambah pelanggan
* Edit pelanggan
* Hapus pelanggan
* Search
* Melihat riwayat transaksi pelanggan

Data:

```text
Nama
Nomor Telepon
Alamat
Catatan
```

---

## Receipt / Invoice Designer

Ini merupakan salah satu fitur utama aplikasi.

Pengguna dapat membuat desain struk sendiri.

Elemen yang dapat digunakan:

```text
Logo
Nama Toko
Alamat
Nomor Telepon
Email
Website
Header
Nomor Invoice
Tanggal
Waktu
Pelanggan
Daftar Produk
Quantity
Harga
Subtotal
Diskon
Pajak
Biaya Tambahan
Grand Total
Jumlah Pembayaran
Kembalian
Metode Pembayaran
QR Code
Separator
Spacer
Footer
Thank You Text
```

Setiap elemen dapat:

* Ditampilkan/disembunyikan
* Diubah urutannya
* Diatur posisinya
* Diatur ukurannya
* Diatur font
* Diatur warna
* Diatur alignment
* Diatur margin
* Diatur padding

Gunakan sistem drag-and-drop untuk mengatur urutan elemen.

---

## Preview Struk

Receipt designer harus mempunyai live preview.

Ketika pengguna mengubah:

* Logo
* Warna
* Font
* Ukuran
* Posisi
* Alignment
* Margin
* Padding
* Urutan
* Visibility

preview harus langsung berubah.

---

## Cetak Struk

Mendukung:

```text
58mm
80mm
```

Optimasi untuk printer thermal.

Saat mencetak:

**Hanya area struk yang dicetak.**

Jangan mencetak:

* Sidebar
* Navbar
* Tombol
* Dashboard
* Editor
* Background aplikasi

---

## Template Struk

Pengguna dapat membuat beberapa template.

Contoh:

```text
Struk Default
Struk Sederhana
Struk Detail
Struk Tanpa Logo
Invoice Customer
```

CRUD:

* Create
* Read
* Update
* Delete
* Duplicate
* Set Default

Hanya satu template yang menjadi default.

---

## Pengaturan

Pengaturan aplikasi meliputi:

### Informasi aplikasi

* Nama aplikasi
* Nama toko
* Alamat
* Nomor telepon
* WhatsApp
* Email
* Website
* Deskripsi
* Logo

### Pengaturan transaksi

* Prefix invoice
* Format invoice
* Mata uang
* Pembulatan

### Pajak

* Aktif/nonaktif
* Persentase pajak

### Diskon

* Aktif/nonaktif
* Jenis diskon
* Default diskon

### Printer

* 58mm
* 80mm

### Receipt

Tombol menuju:

**Receipt Designer**

---

## Backup & Restore

Backup database SQLite.

Restore database dari file backup.

Sebelum restore:

* Buat backup otomatis
* Minta konfirmasi pengguna
* Validasi database

---

## Search

Search tersedia pada:

* Produk
* Pelanggan
* Pesanan
* Penjualan

---

## Notifikasi

Gunakan notifikasi internal aplikasi untuk:

* Berhasil disimpan
* Berhasil dihapus
* Berhasil diperbarui
* Gagal menyimpan
* Gagal menghapus
* Database error
* Upload error
* Print error

Jangan menggunakan browser:

```javascript
alert()
confirm()
prompt()
```

Gunakan custom modal/toast.

---

# 3. KONTEN

## Nama Website

**Receipt Manager**

## Tagline

**Simple Receipt & Invoice Management**

atau gunakan:

**Kelola Transaksi. Atur Struk. Cetak dengan Mudah.**

## Deskripsi

Receipt Manager adalah aplikasi lokal untuk mengelola produk, pelanggan, pesanan, transaksi penjualan, invoice, serta mencetak struk secara fleksibel menggunakan printer thermal.

## Menu Navigasi

```text
Dashboard
Pesanan
Penjualan
Produk
Pelanggan
Pengaturan
```

Pada Pengaturan terdapat:

```text
Informasi Aplikasi
Pengaturan Transaksi
Printer
Receipt Designer
Backup & Restore
```

## Konten legal

Karena aplikasi bersifat lokal/internal, Privacy Policy dan Terms of Service **tidak wajib untuk versi awal**.

Namun struktur aplikasi harus memungkinkan halaman tersebut ditambahkan jika aplikasi nantinya dikembangkan menjadi aplikasi online/public.

---

# 4. DESAIN / UI

## Tema

Gunakan tema:

**Modern Professional POS / Business Application**

Bukan landing page marketing.

Bukan dashboard SaaS generik.

Bukan desain yang terlalu futuristik.

Bukan desain dengan terlalu banyak gradient.

## Gaya

* Clean
* Professional
* Compact
* Modern
* Efisien
* Mudah digunakan
* Fokus pada data dan transaksi

## Warna

Gunakan kombinasi warna profesional.

Rekomendasi:

* Background: putih / abu-abu sangat terang
* Primary: dark blue / navy
* Accent: blue
* Success: green
* Warning: orange
* Error: red

Gunakan warna secara konsisten.

## Dark Mode

Dark mode **opsional**.

Jika dibuat, harus bisa diaktifkan dari Settings.

## Font

Gunakan font modern dan mudah dibaca.

Contoh:

```text
Inter
```

## Desktop

Prioritaskan desktop karena aplikasi digunakan melalui laptop/PC.

## Responsive

Tetap responsive untuk:

* Laptop
* Desktop
* Tablet
* Mobile

Namun layout desktop menjadi prioritas.

## Receipt Designer

Receipt Designer harus mempunyai layout:

```text
┌─────────────────────────────────────────────────────┐
│ ELEMENTS │          RECEIPT PREVIEW │ PROPERTIES    │
└─────────────────────────────────────────────────────┘
```

Harus mudah digunakan untuk mengatur elemen struk.

---

# 5. TEKNIS

## Frontend

Gunakan:

```text
React
TypeScript
Vite
Tailwind CSS
React Router
Lucide React
```

## Backend

Gunakan:

```text
Node.js
Express
TypeScript
```

## Database

Gunakan:

```text
SQLite
```

Database berada di:

```text
data/receipt.db
```

Gunakan library SQLite yang kompatibel dengan Windows.

Prefer:

```text
better-sqlite3
```

atau library SQLite lokal lain yang stabil jika diperlukan.

## API

Gunakan REST API.

Contoh:

```text
/api/products
/api/customers
/api/orders
/api/sales
/api/receipt-templates
/api/settings
/api/uploads
/api/dashboard
```

## Authentication

Untuk versi lokal/internal, authentication kompleks tidak diperlukan.

Jika login ditambahkan, gunakan authentication lokal sederhana dan password harus di-hash.

Jangan menggunakan authentication cloud.

## Storage

Database:

```text
SQLite
```

Upload file:

```text
/uploads/
```

Logo:

```text
/uploads/logos/
```

Jangan menyimpan gambar besar sebagai base64 di database.

## Persistent Data

Data harus tetap ada setelah:

* browser ditutup
* CMD ditutup
* server restart
* laptop restart

Jangan menggunakan localStorage sebagai database.

---

# 6. INFRASTRUKTUR

## Deployment

Aplikasi berjalan secara lokal.

Tidak membutuhkan:

* VPS
* Cloud
* Firebase
* Supabase
* MongoDB Atlas
* Cloud PostgreSQL

## URL

Development:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

Jika menggunakan port berbeda, dokumentasikan di README.

## Development command

Pengguna cukup menjalankan:

```cmd
npm install
npm run dev
```

Tidak boleh membutuhkan dua CMD secara manual.

Frontend dan backend harus dijalankan dari satu perintah.

## Database

```text
data/receipt.db
```

## Backup

Backup database dapat dibuat melalui aplikasi.

Contoh:

```text
backup-2026-09-27.db
```

## HTTPS

HTTPS tidak diperlukan untuk localhost development.

Jika aplikasi nantinya dipublikasikan online, HTTPS wajib digunakan.

## CDN

Tidak diperlukan.

## Monitoring

Untuk versi lokal:

* Server log
* API error log
* Database error log

sudah cukup.

---

# 7. SECURITY

Walaupun aplikasi berjalan lokal, tetap gunakan praktik keamanan yang baik.

## Database

Gunakan:

* Prepared statements
* Parameterized queries
* Foreign keys
* Constraints
* Transactions

Jangan membuat SQL menggunakan string concatenation dari input pengguna.

## Input validation

Validasi input di:

**Frontend + Backend**

Contoh:

* Harga harus numeric
* Quantity harus numeric
* Nama tidak boleh kosong
* Email harus valid jika diisi
* File upload harus memiliki format yang diperbolehkan
* Ukuran file harus dibatasi

## SQL Injection

Gunakan:

**Parameterized Queries / Prepared Statements**

Jangan:

```text
"SELECT * FROM products WHERE name = '" + input + "'"
```

## XSS

Sanitize dan escape user-generated content.

Jangan menggunakan:

```javascript
dangerouslySetInnerHTML
```

tanpa sanitization.

## File Upload Security

Hanya izinkan:

```text
PNG
JPG
JPEG
WEBP
```

Validasi:

* MIME type
* Extension
* File size

Jangan memperbolehkan upload executable files.

## Receipt Template Security

Jangan menggunakan:

```javascript
eval()
```

Jangan menjalankan arbitrary JavaScript dari receipt template.

Gunakan hanya predefined variables:

```text
{{store_name}}
{{invoice_number}}
{{customer_name}}
{{items}}
{{grand_total}}
```

## Rate Limiting

Karena aplikasi lokal, rate limiting tidak menjadi prioritas utama.

Namun jika API authentication ditambahkan, gunakan rate limiting untuk endpoint sensitif.

## CSRF

Jika menggunakan cookie-based authentication, implementasikan CSRF protection.

Jika tidak menggunakan authentication/session cookie, jangan membuat sistem CSRF yang tidak diperlukan.

## Password

Jika authentication digunakan:

* Jangan menyimpan password plaintext
* Gunakan Argon2 atau bcrypt
* Jangan menyimpan password di localStorage

## Backup Security

Backup database harus disimpan sebagai file lokal.

Jangan mengirim database ke server eksternal.

---

# 8. OPERASIONAL

## Admin

Aplikasi digunakan oleh:

* Pemilik usaha
* Admin
* Kasir

Untuk versi lokal sederhana, tidak perlu sistem role yang kompleks.

Jika authentication digunakan, minimal:

```text
Admin
```

dan/atau:

```text
Kasir
```

Namun sistem harus tetap sederhana.

## Update Konten

Data diperbarui langsung melalui aplikasi:

```text
Produk
Pelanggan
Pesanan
Penjualan
Pengaturan
Receipt Template
```

## Update Receipt

Pengguna dapat mengubah desain struk kapan saja melalui:

```text
Pengaturan
→ Receipt Designer
```

## Analytics

Tidak membutuhkan Google Analytics karena aplikasi bersifat lokal.

Dashboard menggunakan data transaksi SQLite sebagai sumber statistik.

## SEO

Tidak diperlukan untuk versi lokal.

SEO hanya diperlukan jika aplikasi nantinya berubah menjadi website publik.

## Google Search Console

Tidak diperlukan.

## Maintenance

Maintenance meliputi:

* Backup database
* Update dependency
* Pemeriksaan error
* Pemeriksaan database
* Pemeriksaan file upload
* Testing printer

## Backup & Recovery

Pengguna harus dapat:

```text
Backup Database
↓
Menyimpan file .db
↓
Restore Database
```

Sebelum restore:

```text
Current Database
↓
Automatic Backup
↓
Restore Selected Backup
```

---

# 9. STRUKTUR TEKNIS AKHIR

Gunakan arsitektur:

```text
Receipt Manager
│
├── Frontend
│   └── React + Vite
│
├── Backend
│   └── Node.js + Express
│
├── Database
│   └── SQLite
│
├── Upload Storage
│   └── Local filesystem
│
└── Development
    └── localhost
```

Flow data:

```text
User
 ↓
React UI
 ↓
REST API
 ↓
Express Backend
 ↓
SQLite
 ↓
Response
 ↓
React UI
```

Persistent data **WAJIB** berasal dari SQLite.

Tidak boleh menggunakan:

```text
Mock data
Hardcoded array
localStorage
sessionStorage
```

sebagai sumber utama data aplikasi.

---

# 10. CARA MENJALANKAN

Setelah project selesai dibuat:

```cmd
cd receipt-app
npm install
npm run dev
```

Kemudian buka:

```text
http://localhost:5173
```

Untuk production build:

```cmd
npm run build
npm start
```

Project harus disediakan sebagai:

```text
receipt-app.zip
```

sehingga pengguna cukup:

```text
Download
↓
Extract
↓
Open CMD
↓
cd receipt-app
↓
npm install
↓
npm run dev
↓
Open localhost
```

Aplikasi harus benar-benar siap digunakan setelah proses tersebut.
