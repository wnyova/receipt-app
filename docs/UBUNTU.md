# Instalasi Receipt Manager di Ubuntu

Aplikasi belum dideploy. Panduan ini untuk menjalankannya sendiri di Ubuntu.

## 1. Persiapan

Pasang Node.js versi 22.13 atau lebih baru (disarankan Node.js 24 LTS), npm, dan Git. Periksa:

```bash
node --version
npm --version
git --version
```

Jika instalasi better-sqlite3 memerlukan kompilasi native:

```bash
sudo apt update
sudo apt install -y build-essential python3
```

Database aplikasi memakai **SQLite** sesuai spesifikasi, otomatis dibuat pada `data/receipt.db`. MariaDB yang sudah ada tidak perlu diubah; tidak diperlukan CREATE DATABASE atau akun database tambahan.

## 2. Ambil source

Clone repository aplikasi:

```bash
git clone https://github.com/wnyova/receipt-app.git
cd receipt-app
```

Atau ekstrak `receipt-app.zip`. Jalankan perintah berikut dari folder `receipt-app`:

```bash
npm ci
npm run build
npm start
```

Buka **http://localhost:3001** dari browser di mesin Ubuntu yang sama. Biarkan terminal berjalan. Ctrl+C menghentikan aplikasi; data tetap tersimpan. Tidak ada autostart atau service yang dipasang otomatis.

Jika port 3001 sudah dipakai:

```bash
PORT=3002 npm start
```

Lalu buka **http://localhost:3002**. Port aplikasi ini terpisah dari aplikasi lain yang menggunakan port 8000.

Untuk mode pengembangan:

```bash
npm run dev
```

Buka **http://localhost:5173**. Satu perintah menjalankan frontend dan backend.

## 3. Jika Ubuntu adalah server terpisah

Aplikasi sengaja hanya menerima localhost dan belum memiliki login. Cara mengakses secara pribadi dari PC lain adalah SSH tunnel, tanpa membuka aplikasi ke publik. Dari PC klien, ganti USER dan ALAMAT_SERVER:

```bash
ssh -L 3001:127.0.0.1:3001 USER@ALAMAT_SERVER
```

Biarkan SSH dan `npm start` di server tetap berjalan, lalu buka **http://localhost:3001** pada browser PC klien. Printer yang dipakai adalah printer pada PC klien melalui dialog cetak browser.

Jangan langsung membuka port ke internet atau memasang reverse proxy publik. Deployment publik memerlukan tambahan autentikasi dan penyesuaian origin terlebih dahulu.

## 4. Data dan pembaruan

- Database: `data/receipt.db`.
- Gambar: `uploads/`.
- Backup otomatis sebelum restore: `data/backups/`.
- Unduh backup melalui Pengaturan → Backup & restore. Untuk pindah mesin, salin juga folder `uploads/`.
- Sebelum update: buat backup, hentikan aplikasi, jalankan `git pull`, `npm ci`, `npm run build`, lalu `npm start`.
- Jangan menghapus folder `data` atau `uploads` ketika memperbarui source.

Panduan operasional, template, dan pencetakan 58/80 mm ada di README.md.
