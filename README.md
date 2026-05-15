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

### Prasyarat

- **Node.js** 20.x atau lebih baru (disarankan LTS).
- **npm** (sudah ikut terpasang bersama Node.js).
- **PostgreSQL** lokal yang sudah berjalan, atau akses ke PostgreSQL cloud (Aiven, Supabase, dsb.).
- **Git** (opsional, untuk clone repository).

### Opsi 1: Clone dari GitHub

```bash
git clone -b master https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
cd sistem-poskesdes-naive-bayes
```

### Opsi 2: Download ZIP

1. Download ZIP dari halaman repository GitHub.
2. Extract ke folder lokal.
3. Buka terminal di folder hasil extract.

### Langkah Setup

#### 1. Install dependency

```bash
npm install
```

#### 2. Buat file environment

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

#### 3. Buat database PostgreSQL (jika pakai lokal)

```sql
CREATE DATABASE poskesdes_db;
```

Jika menggunakan cloud (Aiven/Supabase), bisa langsung pakai database default yang disediakan.

#### 4. Isi file `.env`

**Untuk database lokal:**

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/poskesdes_db?schema=public"
BETTER_AUTH_SECRET="ganti-dengan-secret-random-minimal-32-karakter"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Sistem Diagnosis POSKESDES"

ADMIN_NAME="Admin Poskesdes"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@poskesdes.local"
ADMIN_PASSWORD="password123"
```

**Untuk database Aiven:**

```env
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/defaultdb?sslmode=require"
```

Ganti `PASSWORD`, `HOST`, dan `PORT` sesuai halaman Overview service PostgreSQL Aiven Anda.

Tips membuat secret acak di PowerShell:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

#### 5. Generate Prisma Client

```bash
npm run db:generate
```

#### 6. Sinkronkan schema ke database

```bash
npx prisma db push
```

Perintah ini membuat semua tabel sesuai schema Prisma. Aman dijalankan baik untuk database lokal maupun cloud.

#### 7. Isi data awal (seed)

```bash
npm run db:seed
```

Ini akan mengisi: 5 penyakit, 20 gejala, 100 nilai likelihood, dan 20 standar pertumbuhan WHO.

#### 8. Buat akun admin pertama

```bash
npm run auth:bootstrap
```

Script ini membuat akun admin dari nilai `ADMIN_*` di `.env`.

#### 9. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

#### 10. Login

Gunakan username dan password dari `.env`:

- **Username:** nilai `ADMIN_USERNAME` (default: `admin`)
- **Password:** nilai `ADMIN_PASSWORD` (default: `password123`)

---

## Deploy ke Vercel

### Prasyarat

- Akun [Vercel](https://vercel.com).
- Database PostgreSQL cloud yang dapat diakses dari internet (misal: [Aiven](https://aiven.io), [Supabase](https://supabase.com), [Neon](https://neon.tech), dsb.).
- Repository sudah di-push ke GitHub.

### Langkah Deploy

#### 1. Siapkan database cloud

Pastikan database cloud sudah disetup:

- Schema sudah di-push (`npx prisma db push` dari lokal dengan `DATABASE_URL` mengarah ke cloud).
- Seed data sudah dijalankan (`npm run db:seed`).
- Admin sudah dibuat (`npm run auth:bootstrap`).

Semua perintah di atas bisa dijalankan dari mesin lokal dengan mengganti `DATABASE_URL` di `.env` ke connection string cloud. Contoh:

```env
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/defaultdb?sslmode=require"
```

Lalu jalankan:

```bash
npx prisma db push
npm run db:seed
npm run auth:bootstrap
```

#### 2. Import project di Vercel

1. Buka [vercel.com/new](https://vercel.com/new).
2. Hubungkan akun GitHub dan pilih repository `sistem-poskesdes-naive-bayes`.
3. Framework Preset: **Next.js** (otomatis terdeteksi).
4. Build Command: biarkan default (`next build`).

#### 3. Set environment variables di Vercel

Di halaman konfigurasi project Vercel, tambahkan environment variables berikut:

| Variable | Nilai | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://avnadmin:...@....aivencloud.com:17991/defaultdb?sslmode=require` | Connection string database cloud |
| `BETTER_AUTH_SECRET` | *(secret acak min 32 karakter)* | Wajib sama dengan yang dipakai saat bootstrap admin |
| `BETTER_AUTH_URL` | `https://nama-project.vercel.app` | URL production Vercel Anda |
| `NEXT_PUBLIC_APP_NAME` | `Sistem Diagnosis POSKESDES` | Nama aplikasi |

**Penting:**
- `BETTER_AUTH_URL` harus diisi dengan URL production Vercel (bukan `localhost`).
- `BETTER_AUTH_SECRET` harus **sama** dengan yang digunakan saat `auth:bootstrap` agar session dan password hash tetap valid.
- Variable `ADMIN_*` tidak perlu di-set di Vercel (hanya dipakai saat bootstrap lokal).

#### 4. Deploy

Klik **Deploy**. Vercel akan build dan deploy otomatis. Setelah selesai, buka URL yang diberikan Vercel.

#### 5. Verifikasi

- Buka `https://nama-project.vercel.app/login`.
- Login dengan username dan password admin yang sudah di-bootstrap.
- Cek dashboard, data penyakit (5), gejala (20), dan coba lakukan diagnosis.

### Troubleshooting Deploy

| Masalah | Solusi |
| --- | --- |
| Build error Prisma | Pastikan `prisma generate` berjalan saat build. Ini sudah otomatis via `postinstall` di Vercel. Jika tidak, tambahkan `"postinstall": "prisma generate"` di `scripts` package.json. |
| Database connection timeout | Pastikan `?sslmode=require` ada di `DATABASE_URL` untuk cloud database. |
| Login gagal setelah deploy | Pastikan `BETTER_AUTH_SECRET` di Vercel **sama persis** dengan saat `auth:bootstrap`. |
| `BETTER_AUTH_URL` salah | Harus berupa URL full production (https://...), bukan localhost. |

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
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PORT/defaultdb?sslmode=require"
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
