# Sistem Pakar Diagnosis Gizi Buruk Pada Anak — POSYANDU

Aplikasi web berbasis Next.js untuk membantu POSYANDU mendiagnosis penyakit gizi buruk pada balita menggunakan metode **Naive Bayes** dengan **Laplacian Smoothing** dan tabel rule biner (expert-defined). Sistem dilengkapi preprocessing otomatis berdasarkan **standar WHO**, halaman diagnosis publik (tanpa login), dashboard admin, serta fitur laporan dan cetak.

Branch utama repository ini adalah `master`.

## Daftar Isi

- [Ringkasan Fitur](#ringkasan-fitur)
- [Tech Stack](#tech-stack)
- [Halaman yang Tersedia](#halaman-yang-tersedia)
- [Alur Diagnosis](#alur-diagnosis)
- [Mesin Naive Bayes](#mesin-naive-bayes)
- [Database](#database)
- [Instalasi Lokal](#instalasi-lokal)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Folder](#struktur-folder)

## Ringkasan Fitur

- **Halaman diagnosis publik** — pengguna/masyarakat langsung mengakses halaman diagnosis tanpa login.
- Login admin dengan `better-auth` menggunakan username dan password.
- Dashboard admin: ringkasan statistik penyakit, gejala, diagnosis, dan balita.
- CRUD master data gejala (20 gejala, G01-G20).
- CRUD master data penyakit (5 penyakit, P01-P05) + deskripsi + saran penanganan.
- Tabel rule biner (1/0) per pasangan penyakit-gejala (100 kombinasi).
- **Diagnosis balita** dengan preprocessing WHO otomatis (BB, TB, LiLA).
- Hasil diagnosis: nama penyakit, deskripsi, saran penanganan, gejala terpilih — **tanpa persentase**.
- **Riwayat diagnosis** dengan filter (nama/NIK, dusun, status gizi), pagination, hapus, cetak per-record.
- **Data laporan** bulanan/tahunan: total diagnosis, distribusi hasil, distribusi per dusun, cetak laporan.
- Mode cetak untuk semua laporan dan hasil diagnosis.
- Seed data lengkap: 5 penyakit, 20 gejala, 100 rule biner, 20 standar WHO.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, Lucide React |
| Backend | Next.js Server Components, Server Actions, Better Auth |
| Database | MySQL (XAMPP lokal / Aiven cloud), Prisma ORM |
| Validasi | Zod |
| Tooling | TypeScript, ESLint, tsx |

## Halaman yang Tersedia

### Publik (Tanpa Login)

| Route | Fungsi |
| --- | --- |
| `/` | Redirect ke `/diagnosis` (publik) atau `/dashboard` (jika admin sudah login) |
| `/diagnosis` | Form diagnosis balita + hasil diagnosis (simpan & cetak) |
| `/login` | Halaman login admin |

### Admin (Perlu Login)

| Route | Fungsi |
| --- | --- |
| `/dashboard` | Ringkasan statistik dan aktivitas terbaru |
| `/dashboard/gejala` | CRUD gejala + detail (penyakit terkait) |
| `/dashboard/penyakit` | CRUD penyakit + detail (deskripsi, saran, edit likelihood) |
| `/dashboard/rule` | Matriks rule biner penyakit × gejala (read-only) |
| `/dashboard/riwayat-diagnosis` | Riwayat semua diagnosis, filter, hapus, cetak |
| `/dashboard/laporan` | Laporan bulanan/tahunan + cetak |

### Sidebar Admin

- Dashboard
- Data Input (submenu):
  - Data Gejala
  - Data Penyakit
  - Data Rule
- Riwayat Diagnosis
- Data Laporan

## Alur Diagnosis

1. Pengguna mengakses `/diagnosis` **tanpa login**.
2. Input data balita: nama, NIK, jenis kelamin, nama ibu, dusun, tanggal lahir (opsional, auto-hitung umur).
3. Input pengukuran: umur (bulan), berat badan (kg), tinggi badan (cm), LiLA (cm, opsional untuk < 12 bulan).
4. **Preprocessing WHO otomatis**:
   - BB di bawah standar WHO → G01 (Berat badan sangat kurang) otomatis terdeteksi.
   - TB di bawah standar WHO → G13 (Tinggi badan tidak sesuai usia) otomatis terdeteksi.
   - LiLA < 11.5 cm → G16 (LiLA < 11.5 cm) otomatis terdeteksi (umur >= 12 bulan).
   - LiLA 11.5-12.5 cm → peringatan.
5. Pilih gejala klinis tambahan dari 17 gejala manual (checkbox).
6. Jika **tidak ada gejala sama sekali** (pengukuran normal + tidak ada gejala manual) → hasil "Gizi Baik", disimpan tanpa perhitungan NB.
7. Jika **ada gejala** → jalankan Naive Bayes dengan Laplacian Smoothing → simpan hasil dan ranking.
8. Hasil ditampilkan **tanpa persentase**: nama penyakit, deskripsi, saran penanganan, gejala terpilih.
9. Pengguna dapat **cetak** hasil diagnosis.

## Mesin Naive Bayes

Implementasi menggunakan **Laplacian Smoothing** dengan tabel rule biner dari pakar:

```
Prior:      P(Vj) = 1 / jumlah_penyakit = 1/5 = 0.2

Likelihood: P(Ai|Vj) = (nc + m × p) / (n + m)
            nc = 1 (gejala terkait) atau 0 (tidak terkait) — dari tabel rule biner
            m  = 20 (total gejala)
            p  = 1/5 = 0.2 (prior)
            n  = 1

            nc=1: P = (1 + 4) / 21 = 5/21 ≈ 0.2381
            nc=0: P = (0 + 4) / 21 = 4/21 ≈ 0.1905

Score:      P(Vj) × Π P(Ai|Vj) untuk semua gejala yang dipilih
Posterior:  Score(Vj) / Σ Score(semua Vj) × 100% (disimpan di database, tidak ditampilkan ke user)
```

**5 Penyakit (P01-P05):** Marasmus, Kwashiorkor, Marasmik-Kwashiorkor, Gizi Kurang, Stunting.

**20 Gejala (G01-G20):** Berat badan sangat kurang, Wajah tampak seperti orang tua, Tampak sangat kurus, dst.

## Database

Schema didefinisikan di [prisma/schema.prisma](prisma/schema.prisma).

### Tabel Utama

| Tabel | Fungsi |
| --- | --- |
| `User` | Akun admin |
| `Penyakit` | Master 5 penyakit gizi buruk + deskripsi + saran penanganan |
| `Gejala` | Master 20 gejala klinis |
| `PenyakitGejala` | Tabel rule biner per pasangan penyakit-gejala (100 record, likelihood 0 atau 1) |
| `StandarPertumbuhan` | Tabel standar WHO BB/TB per umur dan jenis kelamin (20 record) |
| `DiagnosisBalita` | Hasil diagnosis per kunjungan balita |
| `DiagnosisGejala` | Gejala yang dipilih saat diagnosis |
| `DiagnosisRanking` | Snapshot ranking probabilitas per penyakit |

### Relasi Utama

- `User` 1:N `DiagnosisBalita` (opsional — diagnosis publik userId = null)
- `Penyakit` 1:N `PenyakitGejala`, 1:N `DiagnosisBalita`, 1:N `DiagnosisRanking`
- `Gejala` 1:N `PenyakitGejala`, 1:N `DiagnosisGejala`
- `DiagnosisBalita` 1:N `DiagnosisGejala`, 1:N `DiagnosisRanking`

---

## Instalasi Lokal

Panduan ini ditujukan untuk menjalankan aplikasi di PC/laptop Anda sendiri. Ikuti langkah-langkah di bawah ini **secara berurutan dari atas ke bawah**.

### Prasyarat (Software yang Wajib Diinstall Terlebih Dahulu)

Pastikan semua software berikut sudah terinstall di komputer Anda **sebelum** memulai setup:

| No | Software | Versi Minimum | Fungsi | Link Download |
| --- | --- | --- | --- | --- |
| 1 | **Node.js** | v20.x LTS | Runtime JavaScript untuk menjalankan aplikasi | [nodejs.org/en/download](https://nodejs.org/en/download) |
| 2 | **npm** | v10.x | Package manager (otomatis ikut saat install Node.js) | *(sudah termasuk di Node.js)* |
| 3 | **XAMPP** | v8.0 atau lebih baru | MySQL database server + phpMyAdmin | [apachefriends.org/download](https://www.apachefriends.org/download.html) |
| 4 | **Git** | Versi terbaru | Untuk clone/download source code | [git-scm.com/downloads](https://git-scm.com/downloads) |

> **Cara install Node.js:** Buka link di atas → download installer sesuai OS (Windows/macOS) → jalankan installer → ikuti wizard sampai selesai. Pilih versi **LTS** (bukan Current). **Jangan install versi 23 atau 24 ke atas** — banyak library native yang belum kompatibel.

> **Cara install XAMPP di Windows:** Download installer dari link di atas → jalankan installer → pilih komponen minimal: **MySQL** dan **phpMyAdmin** (Apache juga perlu dicentang agar phpMyAdmin bisa diakses) → selesaikan instalasi. Setelah install, buka **XAMPP Control Panel** → klik **Start** pada **Apache** dan **MySQL**. Pastikan keduanya berstatus hijau (running).

> **Cara install Git:** Download dari link di atas → jalankan installer → ikuti wizard dengan setting default → selesai.

**Cara cek apakah sudah terinstall** — buka terminal (Command Prompt / PowerShell / Terminal), ketik perintah berikut satu per satu:

```bash
node -v        # Harus muncul v20.x.x atau v22.x.x (JANGAN v23/v24 ke atas)
npm -v         # Harus muncul 10.x.x atau lebih baru
git --version  # Harus muncul git version 2.x.x
```

Untuk MySQL, cek melalui XAMPP Control Panel — pastikan MySQL berstatus **running** (hijau).

Jika salah satu belum muncul atau error, install ulang software tersebut dari link di atas.

---

### Langkah 1 — Download Source Code

Buka terminal (Command Prompt / PowerShell / Terminal), lalu jalankan:

```bash
git clone https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
```

Setelah selesai, masuk ke folder project:

```bash
cd sistem-poskesdes-naive-bayes
```

> **Alternatif tanpa Git:** Buka halaman repository di GitHub → klik tombol hijau **Code** → klik **Download ZIP** → extract ZIP ke folder pilihan Anda → buka terminal di folder hasil extract.

---

### Langkah 2 — Install Dependency (Library yang Dibutuhkan)

```bash
npm install
```

Perintah ini mengunduh semua library yang dibutuhkan aplikasi. Tunggu sampai selesai (bisa 1-3 menit tergantung koneksi internet). Jika muncul warning, abaikan saja — yang penting tidak ada error merah.

---

### Langkah 3 — Buat Database di MySQL (XAMPP)

Pastikan XAMPP sudah berjalan (Apache dan MySQL sudah **Start**). Kemudian buat database kosong bernama `poskesdes_db`. Ada 2 cara:

**Cara A — Via phpMyAdmin (Direkomendasikan):**

1. Buka browser → akses **http://localhost/phpmyadmin**
2. Klik tab **Databases** (atau **Basis Data**) di bagian atas.
3. Di kolom **Create database**, ketik: `poskesdes_db`
4. Pilih **Collation**: `utf8mb4_general_ci`
5. Klik **Create**.

**Cara B — Via terminal (MySQL CLI):**

```bash
mysql -u root -e "CREATE DATABASE poskesdes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

> Jika MySQL XAMPP Anda punya password root, tambahkan flag `-p` lalu masukkan password saat diminta:
> ```bash
> mysql -u root -p -e "CREATE DATABASE poskesdes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
> ```

---

### Langkah 4 — Buat File Konfigurasi `.env`

Salin file template konfigurasi:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Windows (Command Prompt):**

```cmd
copy .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Lalu buka file `.env` dengan text editor (Notepad, VS Code, Notepad++, dsb.) dan pastikan isinya sudah benar:

```env
# Database MySQL via XAMPP (default: user root, tanpa password)
DATABASE_URL="mysql://root:@localhost:3306/poskesdes_db"

# Bisa dibiarkan default atau diganti sesuka hati
BETTER_AUTH_SECRET="ganti-dengan-secret-random-minimal-32-karakter"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Sistem Diagnosis POSYANDU"

# Akun admin pertama (bisa diganti sesuka hati)
ADMIN_NAME="Admin Posyandu"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@posyandu.local"
ADMIN_PASSWORD="password123"
```

> **Catatan:** Secara default XAMPP menggunakan user `root` **tanpa password**. Jika MySQL XAMPP Anda menggunakan password, ubah `DATABASE_URL` menjadi:
> ```
> DATABASE_URL="mysql://root:password_anda@localhost:3306/poskesdes_db"
> ```

> **Port default MySQL XAMPP adalah `3306`.** Jika Anda mengubah port di XAMPP, sesuaikan juga di `DATABASE_URL`.

---

### Langkah 5 — Buat Tabel di Database

Perintah ini membuat semua tabel yang dibutuhkan aplikasi di database `poskesdes_db`:

```bash
npx prisma db push
```

Jika berhasil, akan muncul pesan `Your database is now in sync with your Prisma schema`.

> **Jika error "Can't reach database server":** Pastikan (1) Apache dan MySQL di XAMPP sudah Start (hijau), (2) user dan password di `DATABASE_URL` benar, (3) nama database `poskesdes_db` sudah dibuat di Langkah 3.

---

### Langkah 6 — Isi Data Awal (Seed)

```bash
npm run db:seed
```

Perintah ini mengisi database dengan data awal yang **wajib** ada agar sistem bisa berjalan:

| Data | Jumlah | Keterangan |
| --- | --- | --- |
| Penyakit | 5 | P01 Marasmus, P02 Kwashiorkor, P03 Marasmik-Kwashiorkor, P04 Gizi Kurang, P05 Stunting |
| Gejala | 20 | G01-G20 (gejala klinis gizi buruk pada balita) |
| Tabel Rule Biner | 100 | 20 gejala × 5 penyakit, nilai 1 (terkait) atau 0 (tidak terkait) |
| Standar Pertumbuhan WHO | 20 | BB/TB normal per umur (0-60 bulan) dan jenis kelamin |

> **Penting:** Langkah ini **wajib** dijalankan. Tanpa seed data, aplikasi tidak bisa melakukan diagnosis karena tidak ada data penyakit, gejala, dan tabel rule.

---

### Langkah 7 — Buat Akun Admin Pertama

```bash
npm run auth:bootstrap
```

Script ini membuat akun admin berdasarkan nilai `ADMIN_*` yang Anda isi di file `.env` (Langkah 4). Akun ini digunakan untuk login ke dashboard admin.

---

### Langkah 8 — Jalankan Aplikasi

```bash
npm run dev
```

Tunggu sampai muncul pesan seperti:

```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

Buka browser (Chrome, Edge, Firefox, dsb.) dan akses:

```
http://localhost:3000
```

Anda akan langsung diarahkan ke halaman **Diagnosis** (publik). Untuk masuk ke dashboard admin, klik "Login Admin" di header.

---

### Langkah 9 — Login Admin

Klik **Login Admin** di header halaman diagnosis, lalu masukkan:

- **Username:** `admin` (atau sesuai nilai `ADMIN_USERNAME` di `.env`)
- **Password:** `password123` (atau sesuai nilai `ADMIN_PASSWORD` di `.env`)

Setelah login, Anda akan masuk ke Dashboard Admin.

---

### Ringkasan Semua Perintah (Quick Reference)

Untuk referensi cepat, berikut semua perintah yang perlu dijalankan secara berurutan:

```bash
# 1. Download source code
git clone https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
cd sistem-poskesdes-naive-bayes

# 2. Install dependency
npm install

# 3. Buat database MySQL via phpMyAdmin:
#    Buka http://localhost/phpmyadmin → tab Databases → buat "poskesdes_db" (utf8mb4_general_ci)
#    Atau via terminal:
mysql -u root -e "CREATE DATABASE poskesdes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# 4. Salin file konfigurasi (biasanya tidak perlu edit apa-apa jika pakai XAMPP default)
copy .env.example .env          # Windows CMD
# atau: Copy-Item .env.example .env   # Windows PowerShell
# atau: cp .env.example .env          # macOS/Linux

# 5. Buat tabel di database
npx prisma db push

# 6. Isi data awal (5 penyakit, 20 gejala, 100 rule biner, 20 standar WHO)
npm run db:seed

# 7. Buat akun admin
npm run auth:bootstrap

# 8. Jalankan aplikasi
npm run dev

# 9. Buka browser → http://localhost:3000 → langsung ke halaman diagnosis
#    Untuk admin: klik "Login Admin" → login dengan admin / password123
```

### Troubleshooting (Solusi Masalah Umum)

| Masalah | Penyebab | Solusi |
| --- | --- | --- |
| `npm install` error | Node.js belum terinstall atau versi terlalu lama | Install Node.js v20 LTS dari [nodejs.org](https://nodejs.org) |
| `Cannot find module 'lightningcss...'` saat `npm run dev` | Node.js versi terlalu baru (v23/v24) | Uninstall Node.js → install ulang **v20 LTS** → hapus folder `node_modules` dan `.next` → `npm install` |
| `Can't reach database server` saat `prisma db push` | MySQL XAMPP tidak berjalan atau konfigurasi salah | Buka XAMPP Control Panel → klik **Start** pada Apache dan MySQL → cek `DATABASE_URL` di `.env` |
| `Unknown database 'poskesdes_db'` | Database belum dibuat | Jalankan Langkah 3 (buat database via phpMyAdmin atau terminal) |
| `Access denied for user 'root'@'localhost'` | MySQL XAMPP Anda punya password | Ubah `DATABASE_URL` di `.env` menjadi `mysql://root:password_anda@localhost:3306/poskesdes_db` |
| `npm run db:seed` error "unique constraint" | Seed sudah pernah dijalankan sebelumnya | Data sudah ada, lanjut ke langkah berikutnya |
| `npm run auth:bootstrap` error "user already exists" | Akun admin sudah pernah dibuat | Abaikan, langsung jalankan `npm run dev` |
| Halaman blank / error 500 setelah login | Seed data belum dijalankan | Jalankan `npm run db:seed` lalu refresh browser |
| Port 3000 sudah dipakai | Aplikasi lain menggunakan port 3000 | Tutup aplikasi lain tersebut, atau jalankan `npm run dev -- -p 3001` lalu buka `localhost:3001` |
| Port 3306 konflik / MySQL tidak start | Port MySQL XAMPP bentrok dengan MySQL lain | Buka XAMPP → Config MySQL → ubah port, atau uninstall MySQL versi lain |

### Menjalankan Ulang Aplikasi (Setelah Restart PC)

Setelah setup pertama kali selesai, untuk menjalankan aplikasi lagi cukup:

1. **Buka XAMPP Control Panel** → klik **Start** pada **Apache** dan **MySQL** (pastikan keduanya hijau).
2. Buka terminal, masuk ke folder project:

```bash
cd sistem-poskesdes-naive-bayes
npm run dev
```

Tidak perlu mengulangi langkah install, seed, atau bootstrap — data sudah tersimpan di database.

> **Penting:** MySQL XAMPP harus selalu di-Start terlebih dahulu **sebelum** menjalankan `npm run dev`, karena aplikasi butuh koneksi ke database.

---

## Deploy ke Vercel

Jika ingin aplikasi bisa diakses online (bukan hanya di lokal), Anda bisa deploy ke Vercel.

### Prasyarat

- Akun [Vercel](https://vercel.com) (gratis).
- Database MySQL cloud yang bisa diakses dari internet, misalnya:
  - [PlanetScale](https://planetscale.com) (gratis tier tersedia)
  - [Aiven for MySQL](https://aiven.io) (gratis trial 30 hari)
  - [TiDB Cloud](https://tidbcloud.com) (gratis tier tersedia)
- Repository sudah di-push ke GitHub.

### Langkah Deploy

#### 1. Siapkan database cloud

Database cloud harus diisi data terlebih dahulu **dari mesin lokal Anda**. Ganti `DATABASE_URL` di file `.env` lokal ke connection string database cloud, lalu jalankan 3 perintah ini:

```bash
npx prisma db push       # Buat tabel di database cloud
npm run db:seed          # Isi data awal (5 penyakit, 20 gejala, dll.)
npm run auth:bootstrap   # Buat akun admin
```

Contoh `DATABASE_URL` untuk MySQL cloud:

```env
DATABASE_URL="mysql://username:password@host:port/poskesdes_db?sslaccept=accept_invalid_certs"
```

> Setelah selesai, Anda bisa kembalikan `DATABASE_URL` ke database lokal jika mau tetap develop di lokal.

#### 2. Import project di Vercel

1. Buka [vercel.com/new](https://vercel.com/new).
2. Hubungkan akun GitHub dan pilih repository `sistem-poskesdes-naive-bayes`.
3. Framework Preset: **Next.js** (otomatis terdeteksi).
4. Build Command: biarkan default (`next build`).

#### 3. Set environment variables di Vercel

Di halaman konfigurasi project Vercel (Settings → Environment Variables), tambahkan:

| Variable | Nilai | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `mysql://username:password@host:port/poskesdes_db?sslaccept=accept_invalid_certs` | Connection string database MySQL cloud |
| `BETTER_AUTH_SECRET` | *(secret yang sama dengan saat bootstrap)* | **Wajib sama** dengan yang dipakai saat `auth:bootstrap` |
| `BETTER_AUTH_URL` | `https://nama-project.vercel.app` | URL production Vercel Anda |
| `NEXT_PUBLIC_APP_NAME` | `Sistem Diagnosis POSYANDU` | Nama aplikasi |

**Penting:**
- `BETTER_AUTH_URL` harus URL production Vercel (**bukan** `http://localhost:3000`).
- `BETTER_AUTH_SECRET` harus **sama persis** dengan saat bootstrap admin, karena password hash bergantung pada secret ini.
- Variable `ADMIN_*` **tidak perlu** di-set di Vercel (hanya dipakai saat bootstrap dari lokal).

#### 4. Deploy

Klik **Deploy**. Vercel akan build dan deploy otomatis. Setelah selesai, buka URL yang diberikan Vercel.

#### 5. Verifikasi

- Buka `https://nama-project.vercel.app` — Anda akan langsung diarahkan ke halaman diagnosis.
- Klik **Login Admin** → login dengan username dan password admin.
- Pastikan dashboard menampilkan: 5 penyakit, 20 gejala, dan data standar WHO.

### Troubleshooting Deploy

| Masalah | Solusi |
| --- | --- |
| Build error Prisma | Pastikan `"postinstall": "prisma generate"` ada di `scripts` di `package.json` (sudah ada). |
| Database connection timeout | Pastikan connection string MySQL cloud benar dan database mengizinkan koneksi dari IP Vercel. |
| Login gagal setelah deploy | Pastikan `BETTER_AUTH_SECRET` di Vercel **sama persis** dengan saat `auth:bootstrap`. |
| Halaman kosong / error 500 | Pastikan seed data sudah dijalankan ke database cloud (`npm run db:seed`). |

---

## Cara Penggunaan

### Perintah yang Tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan aplikasi di mode development (localhost:3000) |
| `npm run build` | Build aplikasi untuk production |
| `npm start` | Jalankan hasil build production |
| `npm run lint` | Cek kualitas kode dengan ESLint |
| `npm run typecheck` | Cek error tipe TypeScript |
| `npm run test` | Jalankan unit test |
| `npm run db:generate` | Generate ulang Prisma Client |
| `npm run db:seed` | Isi data awal ke database |
| `npm run db:studio` | Buka Prisma Studio (GUI untuk lihat/edit data di database) |
| `npm run auth:bootstrap` | Buat akun admin pertama |

### Panduan Operasional

**Sebagai Pengguna/Masyarakat (Tanpa Login):**

1. Buka aplikasi — langsung masuk ke halaman diagnosis.
2. Isi data balita (nama, NIK, jenis kelamin, nama ibu, dusun, tanggal lahir).
3. Masukkan pengukuran antropometri (umur, BB, TB, LiLA).
4. Sistem otomatis mendeteksi gejala berdasarkan standar WHO.
5. Pilih gejala klinis tambahan jika ada.
6. Klik "Proses Diagnosis Naive Bayes".
7. Lihat hasil dan cetak jika diperlukan.

**Sebagai Admin:**

1. Klik "Login Admin" di header halaman diagnosis → login.
2. Cek dashboard untuk ringkasan statistik.
3. Kelola master data: gejala, penyakit, dan lihat matriks rule.
4. Lihat riwayat diagnosis: filter, cetak, hapus data.
5. Buka data laporan: statistik bulanan/tahunan, cetak laporan.
6. Untuk diagnosis baru, klik "Mulai Diagnosis Baru" di dashboard.

### Beralih Antara Database Lokal dan Cloud

Cukup ganti nilai `DATABASE_URL` di file `.env`:

```env
# Lokal (XAMPP):
DATABASE_URL="mysql://root:@localhost:3306/poskesdes_db"

# Cloud (contoh):
DATABASE_URL="mysql://username:password@host:port/poskesdes_db?sslaccept=accept_invalid_certs"
```

Setelah ganti, restart dev server (tutup terminal lama, jalankan `npm run dev` lagi). Tidak perlu ubah kode apapun.

---

## Struktur Folder

```text
.
|-- prisma/
|   |-- schema.prisma          # Schema database Prisma (MySQL)
|   `-- seed.ts                # Seed data (5 penyakit, 20 gejala, 100 rule biner, 20 WHO)
|-- scripts/
|   `-- bootstrap-admin.ts     # Script buat akun admin pertama
|-- src/
|   |-- actions/
|   |   |-- diagnosis.ts       # Server action diagnosis balita + delete
|   |   `-- master-data.ts     # Server action CRUD penyakit, gejala, likelihood
|   |-- app/
|   |   |-- api/auth/[...all]/route.ts
|   |   |-- diagnosis/
|   |   |   |-- layout.tsx             # Layout publik (header + Login Admin link)
|   |   |   |-- page.tsx              # Halaman diagnosis publik (form + hasil)
|   |   |   `-- diagnosis-form.tsx    # Client component form diagnosis
|   |   |-- dashboard/
|   |   |   |-- gejala/page.tsx        # CRUD gejala
|   |   |   |-- penyakit/page.tsx      # CRUD penyakit + edit likelihood
|   |   |   |-- rule/page.tsx          # Matriks rule biner (read-only)
|   |   |   |-- riwayat-diagnosis/
|   |   |   |   |-- page.tsx           # Riwayat diagnosis + filter + hapus + cetak
|   |   |   |   `-- delete-button.tsx  # Tombol hapus diagnosis
|   |   |   |-- laporan/page.tsx       # Laporan bulanan/tahunan + cetak
|   |   |   |-- layout.tsx
|   |   |   |-- loading.tsx
|   |   |   |-- page.tsx               # Dashboard admin
|   |   |   `-- template.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- login/page.tsx
|   |   `-- page.tsx                   # Redirect ke /diagnosis atau /dashboard
|   |-- components/
|   |   |-- auth/
|   |   |   |-- login-form.tsx
|   |   |   `-- logout-button.tsx
|   |   `-- layout/
|   |       `-- dashboard-shell.tsx    # Sidebar + shell dashboard admin
|   `-- lib/
|       |-- auth.ts                    # Konfigurasi Better Auth (MySQL)
|       |-- auth-client.ts            # Client-side auth
|       |-- diagnosis-validation.ts   # Validasi input diagnosis
|       |-- naive-bayes.ts            # Mesin Naive Bayes (Laplacian Smoothing)
|       |-- prisma.ts                 # Prisma client singleton
|       |-- prisma-action-errors.ts   # Error mapping Prisma
|       |-- session.ts                # Session guards (getSession, requireAdminSession)
|       |-- session-guards.ts         # Role check helpers
|       |-- utils.ts                  # Utility functions
|       `-- who-standards.ts          # Standar WHO + preprocessing auto-gejala
|-- .env.example
|-- package.json
`-- tsconfig.json
```
