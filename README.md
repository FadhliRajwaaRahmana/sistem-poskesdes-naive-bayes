# Sistem Pakar Diagnosis Gizi Buruk Pada Anak — POSKESDES

Aplikasi web berbasis Next.js untuk membantu POSKESDES mendiagnosis penyakit gizi buruk pada balita menggunakan metode **Naive Bayes** dengan nilai likelihood tetap (expert-defined). Sistem dilengkapi preprocessing otomatis berdasarkan **standar WHO**, dua role pengguna (ADMIN dan USER/orangtua), fitur pemantauan per anak, serta filter per dusun.

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
- Simulasi perhitungan Naive Bayes (prior, likelihood matrix, posterior).
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
| `/dashboard/perhitungan` | Simulasi perhitungan Naive Bayes (prior, likelihood matrix, posterior) |
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
Prior:      P(Ck) = 1 / jumlah_penyakit = 1/5 = 0.2
Likelihood: P(Xi|Ck) = nilai tetap dari tabel pakar (0.0 - 1.0)
Score:      P(Ck) × Π P(Xi|Ck) untuk semua gejala yang dipilih
Posterior:  Score(Ck) / Σ Score(semua Ck) × 100%
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

Panduan ini ditujukan untuk menjalankan aplikasi di PC/laptop Anda sendiri.

### Prasyarat (Wajib Diinstall)

Pastikan semua software berikut sudah terinstall di komputer Anda **sebelum** memulai setup:

| No | Software | Versi Minimum | Fungsi | Link Download |
| --- | --- | --- | --- | --- |
| 1 | **Node.js** | v20.x LTS | Runtime JavaScript untuk menjalankan aplikasi | [nodejs.org/en/download](https://nodejs.org/en/download) |
| 2 | **npm** | v10.x | Package manager (otomatis ikut saat install Node.js) | *(sudah termasuk di Node.js)* |
| 3 | **PostgreSQL** | v14 atau lebih baru | Database server | [postgresql.org/download](https://www.postgresql.org/download/) |
| 4 | **Git** | Versi terbaru | Untuk clone repository (opsional jika download ZIP) | [git-scm.com/downloads](https://git-scm.com/downloads) |

**Cara cek apakah sudah terinstall** — buka terminal/Command Prompt/PowerShell, jalankan:

```bash
node -v        # Harus muncul v20.x.x atau lebih baru
npm -v         # Harus muncul 10.x.x atau lebih baru
psql --version # Harus muncul psql (PostgreSQL) 14.x atau lebih baru
git --version  # Harus muncul git version 2.x.x
```

> **Catatan untuk Windows:** Saat install PostgreSQL, catat **password** yang Anda buat untuk user `postgres`. Password ini akan dipakai di langkah konfigurasi nanti. Pastikan juga service PostgreSQL sudah **berjalan** (cek di Services / Task Manager).

### Mendapatkan Source Code

**Opsi 1: Clone dari GitHub (disarankan)**

```bash
git clone -b master https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
cd sistem-poskesdes-naive-bayes
```

**Opsi 2: Download ZIP**

1. Buka halaman repository di GitHub.
2. Klik tombol hijau **Code** → **Download ZIP**.
3. Extract ZIP ke folder pilihan Anda.
4. Buka terminal di folder hasil extract.

### Langkah Setup (Jalankan Berurutan)

#### Langkah 1 — Install dependency

```bash
npm install
```

Perintah ini mengunduh semua library yang dibutuhkan. Tunggu sampai selesai (bisa beberapa menit tergantung koneksi internet).

#### Langkah 2 — Buat file environment

File `.env` berisi konfigurasi koneksi database dan akun admin. Salin dari template:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Windows (Command Prompt):**

```cmd
copy .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

#### Langkah 3 — Buat database PostgreSQL

Buka **pgAdmin** (ikut terinstall bersama PostgreSQL) atau **psql** di terminal, lalu buat database baru:

**Via psql (terminal):**

```bash
psql -U postgres
```

Masukkan password PostgreSQL Anda, lalu jalankan:

```sql
CREATE DATABASE poskesdes_db;
\q
```

**Via pgAdmin (GUI):**

1. Buka pgAdmin → klik kanan **Databases** → **Create** → **Database...**
2. Isi **Database name**: `poskesdes_db`
3. Klik **Save**.

#### Langkah 4 — Isi file `.env`

Buka file `.env` dengan text editor (Notepad, VS Code, dsb.) dan sesuaikan nilai-nilainya:

```env
# Ganti "your_password" dengan password PostgreSQL Anda
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/poskesdes_db?schema=public"

BETTER_AUTH_SECRET="ganti-dengan-secret-random-minimal-32-karakter"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Sistem Diagnosis POSKESDES"

# Akun admin yang akan dibuat otomatis (bisa diganti sesuai keinginan)
ADMIN_NAME="Admin Poskesdes"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@poskesdes.local"
ADMIN_PASSWORD="password123"
```

> **Yang wajib diganti:** `your_password` di `DATABASE_URL` dengan password PostgreSQL yang Anda buat saat instalasi.

#### Langkah 5 — Generate Prisma Client

```bash
npm run db:generate
```

#### Langkah 6 — Buat tabel di database

```bash
npx prisma db push
```

Perintah ini membuat semua tabel yang dibutuhkan aplikasi di database `poskesdes_db`.

#### Langkah 7 — Isi data awal (seed)

```bash
npm run db:seed
```

Perintah ini mengisi database dengan data awal yang dibutuhkan sistem:

| Data | Jumlah | Keterangan |
| --- | --- | --- |
| Penyakit | 5 | C1 Marasmus, C2 Kwashiorkor, C3 Marasmik-Kwashiorkor, C4 Gizi Kurang, C5 Stunting |
| Gejala | 20 | G01-G20 (gejala klinis gizi buruk pada balita) |
| Nilai Likelihood | 100 | 20 gejala × 5 penyakit, nilai dari tabel pakar |
| Standar Pertumbuhan WHO | 20 | BB/TB normal per umur (0-60 bulan) dan jenis kelamin |

> **Penting:** Langkah ini **wajib** dijalankan. Tanpa seed data, aplikasi tidak bisa melakukan diagnosis karena tidak ada data penyakit, gejala, dan nilai likelihood.

#### Langkah 8 — Buat akun admin pertama

```bash
npm run auth:bootstrap
```

Script ini membuat akun admin berdasarkan nilai `ADMIN_*` yang Anda isi di file `.env`.

#### Langkah 9 — Jalankan aplikasi

```bash
npm run dev
```

Buka browser dan akses:

```
http://localhost:3000
```

#### Langkah 10 — Login

Gunakan kredensial admin dari `.env`:

- **Username:** `admin` (atau sesuai nilai `ADMIN_USERNAME`)
- **Password:** `password123` (atau sesuai nilai `ADMIN_PASSWORD`)

### Ringkasan Semua Perintah (Quick Reference)

Jika sudah pernah setup sebelumnya dan hanya ingin menjalankan ulang:

```bash
npm install              # Install dependency
npm run db:generate      # Generate Prisma Client
npx prisma db push       # Buat/sync tabel database
npm run db:seed          # Isi data awal
npm run auth:bootstrap   # Buat akun admin
npm run dev              # Jalankan aplikasi
```

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
| `NEXT_PUBLIC_APP_NAME` | `Sistem Diagnosis POSKESDES` | Nama aplikasi |

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

### Menjalankan untuk Development

```bash
npm run dev
```

### Build untuk Production

```bash
npm run build
npm start
```

### Menjalankan Test

```bash
npm run test
```

### Menjalankan Lint

```bash
npm run lint
```

### Type Check

```bash
npm run typecheck
```

### Membuka Prisma Studio

```bash
npm run db:studio
```

### Panduan Operasional

**Sebagai ADMIN:**

1. Login ke sistem.
2. Cek dashboard untuk ringkasan statistik.
3. Kelola master data penyakit dan gejala (lihat detail, edit likelihood).
4. Lakukan diagnosis balita dari halaman Diagnosis Balita.
5. Gunakan halaman Perhitungan untuk simulasi dan verifikasi perhitungan NB.
6. Gunakan Rekam Medis untuk melihat riwayat, filter per dusun/status, dan pantau perkembangan anak.
7. Kelola akun USER (orangtua) dari halaman Kelola Pengguna.

**Sebagai USER (Orangtua):**

1. Login dengan akun yang dibuat oleh admin.
2. Lakukan diagnosis balita.
3. Lihat riwayat diagnosis anak sendiri dan pantau perkembangan.

### Beralih Antara Database Lokal dan Cloud

Cukup ganti nilai `DATABASE_URL` di file `.env`:

```env
# Lokal:
DATABASE_URL="postgresql://postgres:password@localhost:5432/poskesdes_db?schema=public"

# Cloud (Aiven):
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/poskesdes_db?sslmode=require"
```

Setelah ganti, restart dev server (`npm run dev`). Tidak perlu ubah kode apapun.

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
|   |   |   |-- perhitungan/page.tsx    # Simulasi perhitungan NB
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
