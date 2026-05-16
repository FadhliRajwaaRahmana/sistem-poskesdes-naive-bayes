# Sistem Pakar Diagnosis Gizi Buruk Pada Anak — POSYANDU

Aplikasi web berbasis Next.js untuk membantu POSYANDU mendiagnosis penyakit gizi buruk pada balita menggunakan metode **Naive Bayes** dengan nilai likelihood tetap (expert-defined). Sistem dilengkapi preprocessing otomatis berdasarkan **standar WHO**, dua role pengguna (ADMIN dan USER/orangtua), fitur pemantauan per anak, serta filter per dusun.

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

- Login dengan `better-auth` menggunakan username dan password.
- **Dua role**: ADMIN (akses penuh) dan USER (diagnosis + riwayat sendiri).
- Dashboard ringkasan statistik penyakit, gejala, diagnosis, dan balita.
- CRUD master data gejala (20 gejala, G01-G20).
- CRUD master data penyakit (5 penyakit, C1-C5) + saran penanganan.
- Edit nilai likelihood per pasangan penyakit-gejala (100 nilai).
- **Diagnosis balita** dengan preprocessing WHO otomatis (BB, TB, LiLA).
- Hasil diagnosis lengkap: probabilitas, deskripsi, saran penanganan, detail perhitungan step-by-step.
- **Rekam medis** dengan filter status (Gizi Baik/Gizi Buruk) dan filter dusun.
- **Pemantauan per anak**: tracking status antar kunjungan (Kondisi Awal, Tetap, Menurun, Meningkat, Membaik, Memburuk).
- Kelola akun pengguna (ADMIN membuat akun USER/orangtua).
- Mode cetak untuk semua laporan.
- Seed data lengkap: 5 penyakit, 20 gejala, 100 likelihood, 20 standar WHO.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, Lucide React |
| Backend | Next.js Server Components, Server Actions, Better Auth |
| Database | PostgreSQL (lokal atau cloud via Aiven/Supabase/dsb.), Prisma ORM |
| Validasi | Zod |
| Tooling | TypeScript, ESLint, tsx |

## Halaman yang Tersedia

### Menu ADMIN

| Route | Fungsi |
| --- | --- |
| `/dashboard` | Ringkasan statistik dan aktivitas terbaru |
| `/dashboard/diagnosis` | Input data balita + pengukuran, preprocessing WHO, proses diagnosis |
| `/dashboard/penyakit` | CRUD penyakit + detail (deskripsi, saran, edit likelihood) |
| `/dashboard/gejala` | CRUD gejala + detail (penyakit terkait, nilai likelihood) |
| `/dashboard/rekam-medis` | Riwayat diagnosis semua balita, filter dusun/status, pemantauan per anak |
| `/dashboard/pengguna` | Kelola akun USER (orangtua) |

### Menu USER (Orangtua)

| Route | Fungsi |
| --- | --- |
| `/dashboard` | Dashboard sederhana |
| `/dashboard/diagnosis` | Input data balita + diagnosis |
| `/dashboard/riwayat` | Riwayat diagnosis sendiri + pemantauan per anak |

## Alur Diagnosis

1. Input data balita: nama, NIK, jenis kelamin, nama ibu, dusun.
2. Input pengukuran: umur (bulan), berat badan (kg), tinggi badan (cm), LiLA (cm, opsional untuk < 12 bulan).
3. **Preprocessing WHO otomatis**:
   - BB di bawah standar WHO → G01 (Berat badan sangat rendah) otomatis tercentang.
   - TB di bawah standar WHO → G13 (Tinggi badan tidak sesuai umur) otomatis tercentang.
   - LiLA < 11.5 cm → G16 (LiLA < 11.5 cm / Gizi Buruk) otomatis tercentang (umur >= 12 bulan).
   - LiLA 11.5-12.5 cm → peringatan Gizi Kurang.
4. Pilih gejala klinis tambahan dari 20 gejala (checkbox).
5. Jika **tidak ada gejala sama sekali** (pengukuran normal + tidak ada gejala manual) → hasil "Gizi Baik", disimpan tanpa perhitungan NB.
6. Jika **ada gejala** → jalankan Naive Bayes → simpan hasil, ranking, dan saran penanganan.

## Mesin Naive Bayes

Implementasi menggunakan **nilai likelihood tetap** dari tabel pakar (bukan training data):

```
Prior:      P(Ci) = 1 / jumlah_penyakit = 1/5 = 0.2
Likelihood: P(X|Ci) = nilai tetap dari tabel pakar (0.0 - 1.0)
Score:      P(Ci) × Π P(X|Ci) untuk semua gejala yang dipilih
Posterior:  Score(Ci) / Σ Score(semua Ci) × 100%
```

**5 Penyakit (C1-C5):** Marasmus, Kwashiorkor, Marasmik-Kwashiorkor, Gizi Kurang, Stunting.

**20 Gejala (G01-G20):** Berat badan sangat rendah, Tampak sangat kurus, Wajah tampak tua, dst.

## Database

Schema didefinisikan di [prisma/schema.prisma](prisma/schema.prisma).

### Tabel Utama

| Tabel | Fungsi |
| --- | --- |
| `User` | Akun admin dan user (orangtua) |
| `Penyakit` | Master 5 penyakit gizi buruk + deskripsi + saran penanganan |
| `Gejala` | Master 20 gejala klinis |
| `PenyakitGejala` | Nilai likelihood per pasangan penyakit-gejala (100 record) |
| `StandarPertumbuhan` | Tabel standar WHO BB/TB per umur dan jenis kelamin (20 record) |
| `DiagnosisBalita` | Hasil diagnosis per kunjungan balita |
| `DiagnosisGejala` | Gejala yang dipilih saat diagnosis |
| `DiagnosisRanking` | Snapshot ranking probabilitas per penyakit |

### Relasi Utama

- `User` 1:N `DiagnosisBalita`
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
| 3 | **PostgreSQL** | v14 atau lebih baru | Database server | [postgresql.org/download](https://www.postgresql.org/download/) |
| 4 | **Git** | Versi terbaru | Untuk clone/download source code | [git-scm.com/downloads](https://git-scm.com/downloads) |

> **Cara install Node.js:** Buka link di atas → download installer sesuai OS (Windows/macOS) → jalankan installer → ikuti wizard sampai selesai. Pilih versi **LTS** (bukan Current).

> **Cara install PostgreSQL di Windows:** Download installer dari link di atas → jalankan installer → **catat password** yang Anda buat untuk user `postgres` (akan dipakai nanti) → centang semua komponen (PostgreSQL Server, pgAdmin, Command Line Tools) → selesaikan instalasi. Pastikan service PostgreSQL **sudah berjalan** (cek di Windows Services atau Task Manager → Services).

> **Cara install Git:** Download dari link di atas → jalankan installer → ikuti wizard dengan setting default → selesai.

**Cara cek apakah sudah terinstall** — buka terminal (Command Prompt / PowerShell / Terminal), ketik perintah berikut satu per satu:

```bash
node -v        # Harus muncul v20.x.x atau lebih baru
npm -v         # Harus muncul 10.x.x atau lebih baru
psql --version # Harus muncul psql (PostgreSQL) 14.x atau lebih baru
git --version  # Harus muncul git version 2.x.x
```

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

### Langkah 3 — Buat Database di PostgreSQL

Anda perlu membuat database kosong bernama `poskesdes_db`. Ada 2 cara:

**Cara A — Via terminal (psql):**

```bash
psql -U postgres
```

Masukkan password PostgreSQL Anda (yang dibuat saat instalasi), lalu ketik:

```sql
CREATE DATABASE poskesdes_db;
```

Jika berhasil muncul `CREATE DATABASE`, ketik `\q` lalu tekan Enter untuk keluar.

**Cara B — Via pgAdmin (aplikasi GUI):**

1. Buka aplikasi **pgAdmin 4** (ikut terinstall bersama PostgreSQL).
2. Di panel kiri, klik kanan **Databases** → **Create** → **Database...**
3. Isi **Database name**: `poskesdes_db`
4. Klik **Save**.

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

Lalu buka file `.env` dengan text editor (Notepad, VS Code, Notepad++, dsb.) dan **ganti `your_password`** dengan password PostgreSQL Anda:

```env
# WAJIB DIGANTI: ganti "your_password" dengan password PostgreSQL Anda
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/poskesdes_db?schema=public"

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

> **Yang WAJIB diganti:** Hanya `your_password` di baris `DATABASE_URL`. Ganti dengan password PostgreSQL yang Anda buat saat instalasi. Sisanya bisa dibiarkan default.

> **Contoh:** Jika password PostgreSQL Anda adalah `rahasia123`, maka baris `DATABASE_URL` menjadi:
> ```
> DATABASE_URL="postgresql://postgres:rahasia123@localhost:5432/poskesdes_db?schema=public"
> ```

---

### Langkah 5 — Buat Tabel di Database

Perintah ini membuat semua tabel yang dibutuhkan aplikasi di database `poskesdes_db`:

```bash
npx prisma db push
```

Jika berhasil, akan muncul pesan `Your database is now in sync with your Prisma schema`.

> **Jika error "Can't reach database server":** Pastikan (1) service PostgreSQL sudah berjalan, (2) password di `DATABASE_URL` benar, (3) nama database `poskesdes_db` sudah dibuat di Langkah 3.

---

### Langkah 6 — Isi Data Awal (Seed)

```bash
npm run db:seed
```

Perintah ini mengisi database dengan data awal yang **wajib** ada agar sistem bisa berjalan:

| Data | Jumlah | Keterangan |
| --- | --- | --- |
| Penyakit | 5 | C1 Marasmus, C2 Kwashiorkor, C3 Marasmik-Kwashiorkor, C4 Gizi Kurang, C5 Stunting |
| Gejala | 20 | G01-G20 (gejala klinis gizi buruk pada balita) |
| Nilai Likelihood | 100 | 20 gejala x 5 penyakit, nilai dari tabel pakar |
| Standar Pertumbuhan WHO | 20 | BB/TB normal per umur (0-60 bulan) dan jenis kelamin |

> **Penting:** Langkah ini **wajib** dijalankan. Tanpa seed data, aplikasi tidak bisa melakukan diagnosis karena tidak ada data penyakit, gejala, dan nilai likelihood.

---

### Langkah 7 — Buat Akun Admin Pertama

```bash
npm run auth:bootstrap
```

Script ini membuat akun admin berdasarkan nilai `ADMIN_*` yang Anda isi di file `.env` (Langkah 4). Akun ini digunakan untuk login pertama kali ke sistem.

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

---

### Langkah 9 — Login

Masukkan kredensial admin:

- **Username:** `admin` (atau sesuai nilai `ADMIN_USERNAME` di `.env`)
- **Password:** `password123` (atau sesuai nilai `ADMIN_PASSWORD` di `.env`)

Setelah login, Anda akan masuk ke Dashboard dan bisa mulai menggunakan sistem.

---

### Ringkasan Semua Perintah (Quick Reference)

Untuk referensi cepat, berikut semua perintah yang perlu dijalankan secara berurutan:

```bash
# 1. Download source code
git clone https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
cd sistem-poskesdes-naive-bayes

# 2. Install dependency
npm install

# 3. Buat database PostgreSQL (via psql)
psql -U postgres -c "CREATE DATABASE poskesdes_db;"

# 4. Salin file konfigurasi lalu edit DATABASE_URL
copy .env.example .env          # Windows CMD
# atau: Copy-Item .env.example .env   # Windows PowerShell
# atau: cp .env.example .env          # macOS/Linux

# 5. Buat tabel di database
npx prisma db push

# 6. Isi data awal (5 penyakit, 20 gejala, 100 likelihood, 20 standar WHO)
npm run db:seed

# 7. Buat akun admin
npm run auth:bootstrap

# 8. Jalankan aplikasi
npm run dev

# 9. Buka browser → http://localhost:3000 → login dengan admin / password123
```

### Troubleshooting (Solusi Masalah Umum)

| Masalah | Penyebab | Solusi |
| --- | --- | --- |
| `npm install` error | Node.js belum terinstall atau versi terlalu lama | Install Node.js v20 LTS dari [nodejs.org](https://nodejs.org) |
| `psql: command not found` | PostgreSQL belum terinstall atau belum masuk PATH | Install PostgreSQL, atau buat database via pgAdmin (GUI) |
| `Can't reach database server` saat `prisma db push` | Service PostgreSQL tidak berjalan atau password salah | Cek service PostgreSQL sudah running, cek password di `.env` |
| `database "poskesdes_db" does not exist` | Database belum dibuat | Jalankan Langkah 3 (buat database) |
| `npm run db:seed` error "unique constraint" | Seed sudah pernah dijalankan sebelumnya | Data sudah ada, lanjut ke langkah berikutnya |
| `npm run auth:bootstrap` error "user already exists" | Akun admin sudah pernah dibuat | Abaikan, langsung jalankan `npm run dev` |
| Halaman blank / error 500 setelah login | Seed data belum dijalankan | Jalankan `npm run db:seed` lalu refresh browser |
| Port 3000 sudah dipakai | Aplikasi lain menggunakan port 3000 | Tutup aplikasi lain tersebut, atau jalankan `npm run dev -- -p 3001` lalu buka `localhost:3001` |

### Menjalankan Ulang Aplikasi (Setelah Restart PC)

Setelah setup pertama kali selesai, untuk menjalankan aplikasi lagi cukup:

```bash
cd sistem-poskesdes-naive-bayes
npm run dev
```

Tidak perlu mengulangi langkah install, seed, atau bootstrap — data sudah tersimpan di database.

---

## Deploy ke Vercel

Jika ingin aplikasi bisa diakses online (bukan hanya di lokal), Anda bisa deploy ke Vercel.

### Prasyarat

- Akun [Vercel](https://vercel.com) (gratis).
- Database PostgreSQL cloud yang bisa diakses dari internet, misalnya:
  - [Aiven](https://aiven.io) (gratis trial 30 hari)
  - [Supabase](https://supabase.com) (gratis tier tersedia)
  - [Neon](https://neon.tech) (gratis tier tersedia)
- Repository sudah di-push ke GitHub.

### Langkah Deploy

#### 1. Siapkan database cloud

Database cloud harus diisi data terlebih dahulu **dari mesin lokal Anda**. Ganti `DATABASE_URL` di file `.env` lokal ke connection string database cloud, lalu jalankan 3 perintah ini:

```bash
npx prisma db push       # Buat tabel di database cloud
npm run db:seed          # Isi data awal (5 penyakit, 20 gejala, dll.)
npm run auth:bootstrap   # Buat akun admin
```

Contoh `DATABASE_URL` untuk Aiven:

```env
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/poskesdes_db?sslmode=require"
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
| `DATABASE_URL` | `postgresql://avnadmin:...@....aivencloud.com:PORT/poskesdes_db?sslmode=require` | Connection string database cloud |
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

- Buka `https://nama-project.vercel.app/login`.
- Login dengan username dan password admin yang sudah di-bootstrap.
- Pastikan dashboard menampilkan: 5 penyakit, 20 gejala, dan data standar WHO.

### Troubleshooting Deploy

| Masalah | Solusi |
| --- | --- |
| Build error Prisma | Pastikan `"postinstall": "prisma generate"` ada di `scripts` di `package.json` (sudah ada). |
| Database connection timeout | Pastikan `?sslmode=require` ada di akhir `DATABASE_URL`. |
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

**Sebagai ADMIN:**

1. Login ke sistem.
2. Cek dashboard untuk ringkasan statistik.
3. Kelola master data penyakit dan gejala (lihat detail, edit likelihood).
4. Lakukan diagnosis balita dari halaman Diagnosis Balita.
5. Gunakan Rekam Medis untuk melihat riwayat, filter per dusun/status, dan pantau perkembangan anak.
6. Kelola akun USER (orangtua) dari halaman Kelola Pengguna.

**Sebagai USER (Orangtua):**

1. Login dengan akun yang dibuat oleh admin.
2. Lakukan diagnosis balita.
3. Lihat riwayat diagnosis anak sendiri dan pantau perkembangan.

### Beralih Antara Database Lokal dan Cloud

Cukup ganti nilai `DATABASE_URL` di file `.env`:

```env
# Lokal:
DATABASE_URL="postgresql://postgres:password@localhost:5432/poskesdes_db?schema=public"

# Cloud (contoh Aiven):
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/poskesdes_db?sslmode=require"
```

Setelah ganti, restart dev server (tutup terminal lama, jalankan `npm run dev` lagi). Tidak perlu ubah kode apapun.

---

## Struktur Folder

```text
.
|-- prisma/
|   |-- schema.prisma          # Schema database Prisma
|   `-- seed.ts                # Seed data (5 penyakit, 20 gejala, 100 likelihood, 20 WHO)
|-- scripts/
|   `-- bootstrap-admin.ts     # Script buat akun admin pertama
|-- src/
|   |-- actions/
|   |   |-- diagnosis.ts       # Server action diagnosis balita
|   |   |-- master-data.ts     # Server action CRUD penyakit, gejala, likelihood
|   |   `-- user-management.ts # Server action CRUD akun user
|   |-- app/
|   |   |-- api/auth/[...all]/route.ts
|   |   |-- dashboard/
|   |   |   |-- diagnosis/page.tsx      # Form + hasil diagnosis balita
|   |   |   |-- gejala/page.tsx         # CRUD gejala + detail
|   |   |   |-- pengguna/page.tsx       # Kelola akun user (admin only)
|   |   |   |-- penyakit/page.tsx       # CRUD penyakit + detail + edit likelihood
|   |   |   |-- rekam-medis/page.tsx    # Rekam medis + pemantauan (admin only)
|   |   |   |-- riwayat/page.tsx        # Riwayat diagnosis (user only)
|   |   |   |-- layout.tsx
|   |   |   |-- loading.tsx
|   |   |   |-- page.tsx               # Dashboard
|   |   |   `-- template.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- login/page.tsx
|   |   `-- page.tsx                   # Redirect ke dashboard/login
|   |-- components/
|   |   |-- auth/
|   |   |   |-- login-form.tsx
|   |   |   `-- logout-button.tsx
|   |   `-- layout/
|   |       `-- dashboard-shell.tsx    # Sidebar + shell dashboard (role-aware)
|   `-- lib/
|       |-- auth.ts                    # Konfigurasi Better Auth
|       |-- auth-client.ts            # Client-side auth
|       |-- diagnosis-helpers.ts      # Helper status pemantauan, severity
|       |-- diagnosis-validation.ts   # Validasi input diagnosis
|       |-- naive-bayes.ts            # Mesin Naive Bayes (fixed likelihood)
|       |-- prisma.ts                 # Prisma client singleton
|       |-- prisma-action-errors.ts   # Error mapping Prisma
|       |-- session.ts                # Session guards (requireSession, requireAdmin)
|       |-- session-guards.ts         # Role check helpers
|       |-- utils.ts                  # Utility functions
|       `-- who-standards.ts          # Standar WHO + preprocessing auto-gejala
|-- .env.example
|-- package.json
`-- tsconfig.json
```
