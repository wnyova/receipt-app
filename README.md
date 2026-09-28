# Receipt Manager

Aplikasi kasir lokal untuk mengelola produk, pelanggan, pesanan, penjualan, dan invoice, serta mendesain dan mencetak struk thermal. Dibangun dengan React, TypeScript, Vite, Express, dan SQLite. Setelah instalasi selesai, aplikasi dapat digunakan tanpa akun layanan cloud atau koneksi internet.

**Pengguna Ubuntu:** ikuti [panduan instalasi Ubuntu](docs/UBUNTU.md). Aplikasi tidak melakukan deployment secara otomatis.

## Persyaratan

- Windows 10/11, macOS, atau Linux.
- Node.js **22.13 atau lebih baru** (disarankan Node.js 24 LTS), npm, dan peramban modern.
- Koneksi internet untuk menjalankan `npm install` pertama kali. Gambar dan font tidak bergantung pada CDN.
- Driver printer thermal yang dipasang terpisah. Pencetakan melalui peramban mendukung template 58 mm dan 80 mm.

Database menggunakan **SQLite** dan dibuat otomatis di `data/receipt.db`. Aplikasi dapat berjalan berdampingan dengan MariaDB; tidak perlu membuat database atau akun MariaDB tambahan.

## Instalasi dan menjalankan aplikasi

Ambil kode dari GitHub:

```bash
git clone https://github.com/wnyova/receipt-app.git
cd receipt-app
npm install
npm run dev
```

Jika menggunakan `receipt-app.zip`, ekstrak arsip tersebut, buka terminal atau CMD di folder `receipt-app`, lalu jalankan `npm install` dan `npm run dev`.

Buka **http://localhost:5173**. Satu perintah menjalankan antarmuka aplikasi dan API pada **http://localhost:3001**. Biarkan terminal tetap terbuka selama aplikasi digunakan. Tekan **Ctrl+C** untuk menghentikannya.

Data tetap tersimpan setelah aplikasi dihentikan atau komputer dimulai ulang. Aplikasi tidak berjalan otomatis saat komputer dinyalakan.

### Jika instalasi SQLite gagal di Windows

`better-sqlite3` biasanya mengunduh komponen biner yang sudah dikompilasi. Jika muncul kesalahan kompilasi, gunakan versi Node.js LTS yang didukung dan sesuai dengan arsitektur Windows, lalu ulangi instalasi. Arsitektur yang tidak menyediakan komponen biner siap pakai mungkin memerlukan Python dan Visual Studio Build Tools dengan komponen **Desktop development with C++**.

## Menjalankan versi produksi

Jalankan dari folder utama proyek setelah dependensi terpasang:

```bash
npm run build
npm start
```

Buka **http://localhost:3001**. Express melayani antarmuka hasil kompilasi dan API pada alamat yang sama. Perintah `npm start` memerlukan hasil `npm run build` yang berhasil.

Kedua mode hanya menerima koneksi dari perangkat lokal. Aplikasi belum memiliki autentikasi, sehingga jangan membukanya melalui penerusan port, proksi publik, atau jaringan bersama. Untuk mengaksesnya dari PC lain melalui server Ubuntu, gunakan panduan **SSH tunnel** di [panduan Ubuntu](docs/UBUNTU.md).

## Penggunaan pertama

1. Buka **Pengaturan → Informasi aplikasi**, isi informasi toko, unggah logo jika diperlukan, lalu simpan.
2. Tambahkan produk beserta kode unik, harga, satuan, dan kategori.
3. Tambahkan pelanggan jika diperlukan. Transaksi tanpa kontak pelanggan menggunakan **Pelanggan umum**.
4. Buka **Pesanan → Pesanan baru**, lalu tambahkan produk, jumlah, diskon, pajak, dan biaya tambahan sesuai kebutuhan.
5. Simpan pesanan yang belum selesai, atau pilih metode pembayaran dan masukkan jumlah pembayaran.
6. Pilih **Selesaikan pembayaran**, lalu konfirmasi. Pesanan tidak dapat diselesaikan jika pembayaran kurang dari total.
7. Buka **Cetak struk**, kemudian pilih printer dan ukuran kertas melalui dialog cetak peramban.

Aplikasi tidak menyertakan produk atau penjualan contoh sebagai data awal. Angka pada Dashboard berasal dari transaksi selesai yang tersimpan di SQLite. Data contoh pada Receipt Designer hanya digunakan untuk pratinjau dan diberi keterangan.

## Pesanan dan perhitungan

- **Status pesanan:** Draft, Menunggu Pembayaran, Diproses, Selesai, dan Dibatalkan.
- **Metode pembayaran:** Cash, Transfer, QRIS, Debit, Credit, dan Other, sesuai nama pilihan pada aplikasi. Pilihan tersebut hanya **mencatat** pembayaran yang dilakukan di luar aplikasi; aplikasi tidak memproses pembayaran bank atau QRIS.
- Total setiap item dihitung dari jumlah × harga, lalu dibulatkan menjadi dua angka desimal. Diskon diterapkan pada subtotal, pajak dihitung setelah diskon, dan biaya tambahan ditambahkan setelahnya. Total akhir dibulatkan sesuai kelipatan yang dipilih.
- Perkalian memakai aritmetika desimal dengan pembulatan ke atas saat tepat di titik tengah (*half-up*). Perhitungan berikutnya menggunakan bilangan bulat dalam satuan terkecil mata uang untuk menghindari akumulasi kesalahan pecahan. Server menghitung ulang setiap pesanan dan mengabaikan total yang dikirim peramban.
- Nomor invoice menggunakan urutan global yang selalu bertambah dan ditetapkan dalam transaksi database. Urutan tidak diulang setiap bulan, dan nomor yang dibatalkan tidak digunakan kembali.
- Pesanan selesai tidak dapat diedit. Pembatalan mempertahankan invoice, tetapi mengeluarkannya dari total penjualan. Membatalkan pesanan tidak otomatis mengembalikan uang kepada pelanggan.
- Struk transaksi selesai menyimpan salinan rincian transaksi, pelanggan, informasi toko, dan template. Mengedit produk atau menghapus pelanggan tidak mengubah invoice lama.
- Logo dan gambar produk mengacu pada berkas lokal. Pertahankan folder `uploads/` agar logo pada struk lama tetap dapat dicetak.
- Statistik nominal pada Dashboard dipisahkan berdasarkan mata uang yang dipilih. Nilai dari mata uang berbeda tidak dijumlahkan. Setiap invoice tetap menyimpan mata uangnya sendiri. Mengubah mata uang toko tidak mengonversi invoice lama atau harga produk; atur mata uang sebelum mulai mencatat transaksi.

## Mendesain struk

Buka **Pengaturan → Printer & struk → Receipt Designer**.

- Buat, duplikasikan, ganti nama, hapus, atau tetapkan template utama.
- Hanya satu template yang menjadi utama. Tetapkan template lain sebagai utama sebelum menghapus template utama saat ini.
- Tarik dan lepas elemen untuk mengubah urutannya. Tombol panah dapat digunakan sebagai alternatif melalui papan ketik atau layar sentuh.
- Klik elemen pada daftar atau pratinjau untuk mengatur tampil/sembunyi, jenis dan ukuran font, warna, teks tebal, perataan, margin, jarak dalam, posisi horizontal, dan lebar.
- Teks pembuka, penutup, ucapan terima kasih, dan isi kode QR mendukung variabel: `{{store_name}}`, `{{invoice_number}}`, `{{customer_name}}`, `{{items}}`, dan `{{grand_total}}`.
- Secara bawaan, kode QR berisi nomor invoice. Kode tersebut bukan kode pembayaran QRIS.
- Simpan template sebelum meninggalkan editor. Template tersimpan di SQLite.
- Elemen berwarna dicetak dalam gradasi abu-abu pada printer thermal monokrom.

Tata letak struk mengikuti urutan elemen agar dapat menyesuaikan jumlah item. Posisi dapat diatur melalui pergeseran horizontal, lebar, perataan, dan jarak vertikal. Baris yang berisi pasangan label dan nominal tetap menempatkan keduanya pada sisi berlawanan; pengaturan perataan terutama berlaku pada elemen teks tunggal.

## Mencetak struk

Hanya area struk yang masuk ke hasil cetak. Bilah samping, navigasi, tombol, editor, dan latar belakang aplikasi tidak ikut dicetak.

1. Pasang driver dan pilih printer thermal yang akan digunakan.
2. Pilih ukuran kertas **58 mm** atau **80 mm** pada aplikasi dan pengaturan driver.
3. Gunakan **skala 100%**, **tanpa margin**, dan nonaktifkan **header/footer peramban**.
4. Cetak struk percobaan. Sesuaikan lebar area cetak pada driver jika diperlukan.

Dukungan aturan cetak `@page` dan panjang kertas gulung berbeda menurut peramban dan driver. Aplikasi meminta lebar yang dipilih, tetapi pengaturan driver tetap menentukan hasil akhirnya.

Aplikasi tidak memilih printer secara diam-diam, mengirim perintah ESC/POS langsung, mengoperasikan laci kasir, atau memastikan bahwa pencetakan fisik berhasil. Mencetak struk tidak mengubah pesanan menjadi lunas. Invoice yang dibatalkan diberi tanda **DIBATALKAN**.

## Pencadangan dan pemulihan data

Data usaha disimpan di:

```text
data/receipt.db
uploads/logos/
uploads/products/
```

Gunakan **Pengaturan → Backup & restore → Unduh backup** untuk mengunduh salinan database `.db` yang konsisten, termasuk saat aplikasi sedang berjalan. Jangan hanya menyalin `receipt.db` secara manual ketika aplikasi aktif: sebagian data yang sudah tersimpan mungkin masih berada di berkas pendamping WAL milik SQLite.

Untuk memindahkan seluruh aplikasi ke perangkat lain, salin juga folder `uploads/`. Cadangan database tidak menyertakan gambar. Simpan cadangan di media penyimpanan terpisah.

### Memulihkan cadangan

1. Pilih berkas cadangan `.db` dari aplikasi ini, maksimal **100 MB**.
2. Konfirmasikan penggantian data melalui dialog di dalam aplikasi.
3. Aplikasi memeriksa integritas SQLite, versi struktur database, isi data aplikasi, dan relasi antartabel.
4. Database saat ini dicadangkan otomatis ke `data/backups/before-restore-*.db`.
5. Data digantikan dalam satu transaksi database. Jika penggantian gagal, data lama tetap tersimpan.

Berkas cadangan tidak dienkripsi, sehingga perlu dijaga sebagai data usaha pribadi. Jika salah memilih cadangan, pulihkan cadangan otomatis melalui menu yang sama. Hentikan aktivitas pencatatan selama pemulihan berlangsung. Cadangan lama terkumpul di `data/backups`; atur penyimpanan dan penghapusannya sesuai kebutuhan.

## Keamanan

- Kueri berparameter, relasi antartabel, batasan database, dan transaksi digunakan untuk menjaga konsistensi data.
- Masukan formulir dan API divalidasi menggunakan Zod.
- Server hanya menerima koneksi lokal, memeriksa Host/Origin, dan menolak permintaan lintas situs. Tidak menggunakan autentikasi cloud.
- Unggahan gambar dibatasi ke PNG, JPEG, dan WEBP, maksimal 5 MB. Ekstensi, tipe MIME, dan penanda isi berkas diperiksa; nama berkas dibuat secara acak.
- Teks ditampilkan melalui mekanisme pengamanan bawaan React. Template tidak dapat menjalankan JavaScript atau menyisipkan HTML.
- Berkas operasional, database, unggahan, dan berkas konfigurasi lingkungan tidak disertakan dalam Git atau paket distribusi.

## Pengembangan

Jalankan pengujian, kompilasi, dan perapian format kode dengan:

```bash
npm test
npm run build
npm run format
```

Jalur API: `/api/products`, `/api/customers`, `/api/orders`, `/api/sales`, `/api/receipt-templates`, `/api/settings`, `/api/uploads`, `/api/dashboard`, `/api/backup`, dan `/api/restore`.

| Folder | Isi |
| --- | --- |
| `src/` | Halaman React, komponen bersama, dan tampilan struk |
| `shared/` | Skema validasi, tipe data, dan perhitungan nominal |
| `server/` | API Express, inisialisasi SQLite, dan titik masuk server |
| `scripts/` | Skrip untuk menjalankan aplikasi dalam satu perintah |
| `tests/` | Pengujian integrasi database/API dan perhitungan nominal |
| `docs/` | Spesifikasi awal, rencana implementasi, panduan Ubuntu, dan catatan pengujian |

Tanggal mengikuti zona waktu lokal komputer. Buat cadangan sebelum memperbarui aplikasi. Jangan menghapus `data/` atau `uploads/` ketika mengganti kode. Untuk memperbarui instalasi produksi, hentikan aplikasi, ambil kode terbaru, jalankan `npm install` dan `npm run build`, lalu jalankan kembali dengan `npm start`.
