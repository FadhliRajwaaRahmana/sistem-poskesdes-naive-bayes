# Sistem POSKESDES Naive Bayes

Aplikasi admin berbasis Next.js untuk membantu POSKESDES melakukan klasifikasi penyakit pasien menggunakan metode Naive Bayes. Sistem ini menyediakan autentikasi admin, pengelolaan master data, pengelolaan data training, proses diagnosa pasien, simulasi perhitungan probabilitas, serta arsip riwayat diagnosa yang bisa difilter dan dicetak.

Branch utama repository ini adalah `master`.

## Daftar Isi

Lompat cepat:
[Instalasi Lokal](#instalasi-lokal) | [Prasyarat](#prasyarat) | [Langkah Setup Lengkap](#langkah-setup-lengkap) | [Cara Penggunaan](#cara-penggunaan)

- [Ringkasan Fitur](#ringkasan-fitur)
- [Tech Stack](#tech-stack)
- [Alur Aplikasi](#alur-aplikasi)
- [Halaman yang Tersedia](#halaman-yang-tersedia)
- [Arsitektur Kode](#arsitektur-kode)
- [Frontend](#frontend)
- [Backend](#backend)
- [Mesin Naive Bayes](#mesin-naive-bayes)
- [Detail Perhitungan Naive Bayes](#detail-perhitungan-naive-bayes)
- [Struktur Folder Aktif](#struktur-folder-aktif)
- [Database](#database)
- [Ringkasan Relasi](#ringkasan-relasi)
- [Detail Tabel dan Kolom](#detail-tabel-dan-kolom)
- [Seed Data Bawaan](#seed-data-bawaan)
- [Instalasi Lokal](#instalasi-lokal)
- [Prasyarat](#prasyarat)
- [Opsi 1: Clone dari GitHub](#opsi-1-clone-dari-github)
- [Opsi 2: Download ZIP](#opsi-2-download-zip)
- [Langkah Setup Lengkap](#langkah-setup-lengkap)
- [1. Install dependency](#1-install-dependency)
- [2. Buat file environment](#2-buat-file-environment)
- [3. Buat database PostgreSQL](#3-buat-database-postgresql)
- [4. Isi file `.env`](#4-isi-file-env)
- [5. Generate Prisma Client](#5-generate-prisma-client)
- [6. Sinkronkan schema ke database](#6-sinkronkan-schema-ke-database)
- [7. Isi data awal](#7-isi-data-awal)
- [8. Buat akun admin pertama](#8-buat-akun-admin-pertama)
- [9. Jalankan aplikasi](#9-jalankan-aplikasi)
- [10. Login ke sistem](#10-login-ke-sistem)
- [Cara Penggunaan](#cara-penggunaan)
- [Panduan Operasional Singkat](#panduan-operasional-singkat)
- [Catatan Penting](#catatan-penting)
- [Validasi yang Tersedia di Repo](#validasi-yang-tersedia-di-repo)
- [Status Scan Repository](#status-scan-repository)

## Ringkasan Fitur

- Login admin dengan `better-auth` menggunakan username dan password.
- Dashboard ringkasan statistik gejala, penyakit, data training, dan riwayat diagnosa.
- CRUD data gejala.
- CRUD data penyakit.
- Manajemen data training berbasis relasi penyakit-gejala.
- Diagnosa pasien dengan perhitungan Naive Bayes.
- Simulasi halaman perhitungan untuk melihat prior, likelihood, score, dan posterior tanpa menyimpan hasil.
- Riwayat diagnosa lengkap dengan filter, ranking probabilitas, dan mode cetak.
- Seed data awal gejala, penyakit, dan sampel training.
- Script bootstrap admin agar akun admin pertama bisa dibuat otomatis dari `.env`.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, Lucide React |
| Backend | Next.js Server Components, Server Actions, Better Auth |
| Database | PostgreSQL, Prisma ORM |
| Validasi | Zod |
| Tooling | TypeScript, ESLint, tsx, Node test runner |

## Alur Aplikasi

1. User membuka `/`, lalu diarahkan otomatis ke `/dashboard` jika sudah login sebagai admin, atau ke `/login` jika belum.
2. Admin login memakai username dan password yang disimpan melalui `better-auth`.
3. Setelah login, semua halaman dashboard dijaga oleh `requireAdminSession()` di [src/lib/session.ts](src/lib/session.ts).
4. Admin dapat mengelola gejala, penyakit, dan data training dari menu dashboard.
5. Saat form diagnosa dikirim, server action `submitDiagnosis()`:
   - memvalidasi input pasien,
   - memeriksa gejala yang masih valid di database,
   - menghitung ranking penyakit dengan Naive Bayes,
   - menyimpan hasil diagnosa, gejala terpilih, dan snapshot ranking probabilitas.
6. Halaman riwayat menampilkan seluruh arsip diagnosa dan menyediakan mode print untuk laporan.

## Halaman yang Tersedia

| Route | Fungsi |
| --- | --- |
| `/` | Redirect otomatis ke login atau dashboard |
| `/login` | Form login admin |
| `/dashboard` | Ringkasan statistik dan aktivitas terbaru |
| `/dashboard/gejala` | CRUD master data gejala |
| `/dashboard/penyakit` | CRUD master data penyakit |
| `/dashboard/data-training` | Menambah dan menghapus sampel training |
| `/dashboard/diagnosa` | Input data pasien dan proses diagnosa |
| `/dashboard/perhitungan` | Simulasi perhitungan Naive Bayes |
| `/dashboard/riwayat` | Arsip diagnosa, filter, pagination, dan cetak laporan |
| `/api/auth/[...all]` | Endpoint auth Better Auth |

## Arsitektur Kode

### Frontend

- Layout utama aplikasi didefinisikan di [src/app/layout.tsx](src/app/layout.tsx).
- Theme dan utility class global ada di [src/app/globals.css](src/app/globals.css).
- Shell dashboard dengan sidebar responsif ada di [src/components/layout/dashboard-shell.tsx](src/components/layout/dashboard-shell.tsx).
- Form login client-side ada di [src/components/auth/login-form.tsx](src/components/auth/login-form.tsx).
- Tombol logout client-side ada di [src/components/auth/logout-button.tsx](src/components/auth/logout-button.tsx).
- Animasi transisi halaman dashboard menggunakan [src/app/dashboard/template.tsx](src/app/dashboard/template.tsx).

### Backend

- Konfigurasi auth ada di [src/lib/auth.ts](src/lib/auth.ts).
- Prisma client singleton ada di [src/lib/prisma.ts](src/lib/prisma.ts).
- Session dan guard admin ada di [src/lib/session.ts](src/lib/session.ts) dan [src/lib/session-guards.ts](src/lib/session-guards.ts).
- Server action CRUD master data ada di [src/actions/master-data.ts](src/actions/master-data.ts).
- Server action diagnosa pasien ada di [src/actions/diagnosa.ts](src/actions/diagnosa.ts).

### Mesin Naive Bayes

- Perhitungan utama ada di [src/lib/naive-bayes.ts](src/lib/naive-bayes.ts).
- Fungsi matematika pembantu ada di [src/lib/naive-bayes-math.ts](src/lib/naive-bayes-math.ts).
- Validasi input tanggal dan gejala diagnosa ada di [src/lib/diagnosa-validation.ts](src/lib/diagnosa-validation.ts).

## Detail Perhitungan Naive Bayes

Implementasi pada project ini memakai pendekatan berikut:

- `prior = jumlah training penyakit / total seluruh data training`
- `likelihood = (matchedCount + 1) / (totalKemunculanGejalaPadaPenyakit + totalGejalaMaster)`
- `score = prior x seluruh likelihood gejala terpilih`
- `posterior = score / total seluruh score`

Catatan implementasi:

- Smoothing yang dipakai adalah Laplace smoothing.
- Denominator likelihood memakai total kemunculan gejala pada kelas penyakit, bukan jumlah baris training semata.
- Sistem menyimpan ranking hasil per diagnosa ke tabel `DiagnosaRanking`, sehingga hasil historis tetap konsisten walaupun data training berubah di masa depan.
- Jika tidak ada gejala valid atau total score tidak menghasilkan prediksi yang layak, hasil akan ditandai sebagai "Diagnosa penyakit tidak diketahui".

## Struktur Folder Aktif

```text
.
|-- prisma/
|   |-- schema.prisma
|   |-- seed.ts
|   |-- seed-utils.ts
|   `-- seed-utils.test.ts
|-- scripts/
|   `-- bootstrap-admin.ts
|-- src/
|   |-- actions/
|   |   |-- diagnosa.ts
|   |   `-- master-data.ts
|   |-- app/
|   |   |-- api/auth/[...all]/route.ts
|   |   |-- dashboard/
|   |   |   |-- data-training/page.tsx
|   |   |   |-- diagnosa/page.tsx
|   |   |   |-- gejala/page.tsx
|   |   |   |-- layout.tsx
|   |   |   |-- loading.tsx
|   |   |   |-- page.tsx
|   |   |   |-- penyakit/page.tsx
|   |   |   |-- perhitungan/page.tsx
|   |   |   |-- riwayat/page.tsx
|   |   |   `-- template.tsx
|   |   |-- favicon.ico
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- login/page.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- auth/
|   |   |   |-- login-form.tsx
|   |   |   `-- logout-button.tsx
|   |   `-- layout/
|   |       `-- dashboard-shell.tsx
|   `-- lib/
|       |-- auth-client.ts
|       |-- auth.ts
|       |-- diagnosa-validation.ts
|       |-- naive-bayes-math.ts
|       |-- naive-bayes.ts
|       |-- prisma-action-errors.ts
|       |-- prisma.ts
|       |-- session-guards.ts
|       |-- session.ts
|       `-- utils.ts
|-- .env.example
|-- eslint.config.mjs
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
`-- tsconfig.json
```

## Database

Schema database didefinisikan di [prisma/schema.prisma](prisma/schema.prisma).

### Ringkasan Relasi

- `User` 1:N `Session`
- `User` 1:N `Account`
- `User` 1:N `DiagnosaPasien`
- `Penyakit` 1:N `DataTraining`
- `DataTraining` 1:N `TrainingGejala`
- `Gejala` 1:N `TrainingGejala`
- `DiagnosaPasien` 1:N `DiagnosaGejala`
- `Gejala` 1:N `DiagnosaGejala`
- `DiagnosaPasien` 1:N `DiagnosaRanking`
- `Penyakit` 1:N `DiagnosaPasien`
- `Penyakit` 1:N `DiagnosaRanking`

### Detail Tabel dan Kolom

#### 1. `user`

Dipakai untuk akun admin aplikasi.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `name` | `String` | Nama admin |
| `username` | `String` | Username unik untuk login |
| `displayUsername` | `String?` | Nama tampilan username, opsional |
| `email` | `String` | Email unik |
| `emailVerified` | `Boolean` | Status verifikasi email |
| `image` | `String?` | Foto profil opsional |
| `role` | `Role` | Saat ini hanya `ADMIN` |
| `createdAt` | `DateTime` | Waktu dibuat |
| `updatedAt` | `DateTime` | Waktu diperbarui |

#### 2. `session`

Dipakai Better Auth untuk session login.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `expiresAt` | `DateTime` | Masa berlaku session |
| `token` | `String` | Token unik session |
| `createdAt` | `DateTime` | Waktu dibuat |
| `updatedAt` | `DateTime` | Waktu diperbarui |
| `ipAddress` | `String?` | IP user saat login |
| `userAgent` | `String?` | User agent browser |
| `userId` | `String` | FK ke `user` |

#### 3. `account`

Dipakai Better Auth untuk akun/provider auth.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `accountId` | `String` | ID akun provider |
| `providerId` | `String` | Provider auth |
| `userId` | `String` | FK ke `user` |
| `accessToken` | `String?` | Token akses opsional |
| `refreshToken` | `String?` | Token refresh opsional |
| `idToken` | `String?` | ID token opsional |
| `accessTokenExpiresAt` | `DateTime?` | Expired access token |
| `refreshTokenExpiresAt` | `DateTime?` | Expired refresh token |
| `scope` | `String?` | Scope provider |
| `password` | `String?` | Hash password untuk login email/password |
| `createdAt` | `DateTime` | Waktu dibuat |
| `updatedAt` | `DateTime` | Waktu diperbarui |

#### 4. `verification`

Dipakai Better Auth untuk kebutuhan verifikasi/token.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `identifier` | `String` | Identitas target verifikasi |
| `value` | `String` | Nilai token/verifikasi |
| `expiresAt` | `DateTime` | Masa berlaku |
| `createdAt` | `DateTime?` | Waktu dibuat |
| `updatedAt` | `DateTime?` | Waktu diperbarui |

#### 5. `Gejala`

Master gejala untuk diagnosa dan data training.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `kode` | `String` | Kode gejala unik, mis. `G01` |
| `nama` | `String` | Nama gejala |
| `createdAt` | `DateTime` | Waktu dibuat |
| `updatedAt` | `DateTime` | Waktu diperbarui |

#### 6. `Penyakit`

Master penyakit yang menjadi target klasifikasi.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `kode` | `String` | Kode penyakit unik, mis. `P01` |
| `nama` | `String` | Nama penyakit |
| `deskripsi` | `String?` | Deskripsi singkat penyakit |
| `createdAt` | `DateTime` | Waktu dibuat |
| `updatedAt` | `DateTime` | Waktu diperbarui |

#### 7. `DataTraining`

Mewakili satu sampel training untuk sebuah penyakit.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `penyakitId` | `String` | FK ke `Penyakit` |
| `createdAt` | `DateTime` | Waktu dibuat |

#### 8. `TrainingGejala`

Pivot antara `DataTraining` dan `Gejala`.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `trainingId` | `String` | FK ke `DataTraining` |
| `gejalaId` | `String` | FK ke `Gejala` |

Constraint penting:

- `@@unique([trainingId, gejalaId])`

#### 9. `DiagnosaPasien`

Tabel inti untuk hasil diagnosa pasien.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `tanggal` | `DateTime` | Tanggal pemeriksaan |
| `namaPasien` | `String` | Nama pasien |
| `noKartu` | `String?` | Nomor kartu pasien |
| `umur` | `Int` | Umur pasien |
| `alamat` | `String?` | Alamat pasien |
| `penyakitId` | `String?` | FK ke `Penyakit` hasil tertinggi |
| `hasilDiagnosa` | `String` | Nama hasil akhir diagnosa |
| `keterangan` | `String?` | Catatan hasil/ringkasan |
| `userId` | `String` | FK ke admin pembuat diagnosa |
| `createdAt` | `DateTime` | Waktu data dibuat |

#### 10. `DiagnosaGejala`

Pivot gejala yang dipilih pada saat diagnosa pasien.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `diagnosaId` | `String` | FK ke `DiagnosaPasien` |
| `gejalaId` | `String` | FK ke `Gejala` |

Constraint penting:

- `@@unique([diagnosaId, gejalaId])`

#### 11. `DiagnosaRanking`

Snapshot ranking probabilitas seluruh penyakit pada satu diagnosa.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `String` | Primary key |
| `diagnosaId` | `String` | FK ke `DiagnosaPasien` |
| `penyakitId` | `String?` | FK ke `Penyakit` |
| `kodePenyakit` | `String` | Salinan kode penyakit saat diagnosa |
| `namaPenyakit` | `String` | Salinan nama penyakit saat diagnosa |
| `prior` | `Float` | Nilai prior |
| `posterior` | `Float` | Nilai posterior |
| `score` | `Float` | Score sebelum normalisasi |
| `peringkat` | `Int` | Urutan ranking |
| `createdAt` | `DateTime` | Waktu dibuat |

Constraint penting:

- `@@unique([diagnosaId, peringkat])`

## Seed Data Bawaan

Seed awal di [prisma/seed.ts](prisma/seed.ts) akan menambahkan:

- 7 gejala awal (`G01` sampai `G07`)
- 5 penyakit awal (`P01` sampai `P05`)
- 18 sampel data training

Contoh data:

- `G01` Pilek
- `G03` Demam
- `P01` Influenza
- `P02` ISPA
- `P03` Gastritis
- `P04` Hipertensi
- `P05` Rematik

## Instalasi Lokal

Bagian ini ditujukan untuk client yang mendapatkan project melalui clone Git atau download ZIP.

### Prasyarat

Sebelum menjalankan project, install hal berikut:

- Git, jika ingin clone repository.
- Node.js LTS modern. Disarankan Node.js 20.x atau lebih baru agar cocok dengan stack Next.js dan toolchain repo ini.
- npm. Biasanya sudah ikut terpasang bersama Node.js.
- PostgreSQL lokal atau server PostgreSQL yang bisa diakses dari `DATABASE_URL`.
- Editor kode seperti VS Code, jika ingin mengubah source code.

### Opsi 1: Clone dari GitHub

```bash
git clone -b master https://github.com/FadhliRajwaa/sistem-poskesdes-naive-bayes.git
cd sistem-poskesdes-naive-bayes
```

### Opsi 2: Download ZIP

1. Download ZIP dari repository GitHub.
2. Extract ZIP ke folder lokal.
3. Buka terminal di folder hasil extract.

Contoh PowerShell:

```powershell
cd E:\path\ke\folder\hasil-extract\sistem-poskesdes-naive-bayes
```

### Langkah Setup Lengkap

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

#### 3. Buat database PostgreSQL

Buat database kosong, misalnya:

```sql
CREATE DATABASE poskesdes_db;
```

#### 4. Isi file `.env`

Contoh isi minimal:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/poskesdes_db?schema=public"
BETTER_AUTH_SECRET="ganti-dengan-secret-random-minimal-32-karakter"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Sistem Diagnosa POSKESDES"

ADMIN_NAME="Admin Poskesdes"
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@poskesdes.local"
ADMIN_PASSWORD="password123"
```

Penjelasan:

- `DATABASE_URL`: koneksi ke PostgreSQL.
- `BETTER_AUTH_SECRET`: secret untuk session/auth, wajib panjang dan acak.
- `BETTER_AUTH_URL`: URL aplikasi lokal.
- `NEXT_PUBLIC_APP_NAME`: nama aplikasi.
- `ADMIN_*`: akun admin awal yang akan dibuat oleh script bootstrap.

Jika Anda perlu membuat secret acak cepat di PowerShell:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

#### 5. Generate Prisma Client

```bash
npm run db:generate
```

#### 6. Sinkronkan schema ke database

Karena repository ini belum menyertakan folder migration Prisma, cara paling aman untuk setup lokal baru adalah:

```bash
npx prisma db push
```

Jika Anda memang ingin membuat migration lokal pertama, gunakan:

```bash
npx prisma migrate dev --name init
```

#### 7. Isi data awal

```bash
npm run db:seed
```

#### 8. Buat akun admin pertama

```bash
npm run auth:bootstrap
```

Script ini akan:

- membuat user admin baru jika belum ada,
- atau menyinkronkan data admin jika email yang sama sudah ada.

#### 9. Jalankan aplikasi

```bash
npm run dev
```

Lalu buka:

```text
http://localhost:3000
```

#### 10. Login ke sistem

Gunakan kredensial admin yang Anda isi pada `.env`:

- Username: nilai `ADMIN_USERNAME`
- Password: nilai `ADMIN_PASSWORD`

## Cara Penggunaan

### Menjalankan untuk Development

```bash
npm run dev
```

### Menjalankan untuk Production Lokal

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

### Menjalankan Type Check

```bash
npm run typecheck
```

### Membuka Prisma Studio

```bash
npm run db:studio
```

## Panduan Operasional Singkat

Urutan penggunaan yang disarankan untuk admin:

1. Login ke sistem.
2. Cek dan lengkapi master data gejala.
3. Cek dan lengkapi master data penyakit.
4. Tambahkan data training yang menghubungkan penyakit dengan gejala.
5. Lakukan diagnosa pasien dari halaman `/dashboard/diagnosa`.
6. Gunakan halaman `/dashboard/perhitungan` untuk menjelaskan proses inferensi secara transparan.
7. Gunakan `/dashboard/riwayat` untuk mencari arsip dan mencetak laporan.

## Catatan Penting

- Role yang didukung saat ini hanya `ADMIN`.
- Hasil diagnosa historis menyimpan snapshot ranking probabilitas pada saat diagnosa dilakukan.
- Folder `src/app` adalah aplikasi aktif yang dijalankan Next.js.
- Route auth ditangani oleh Better Auth melalui `src/app/api/auth/[...all]/route.ts`.
- File seed dan bootstrap admin penting untuk demo lokal yang siap dipakai client.

## Validasi yang Tersedia di Repo

Project ini sudah memiliki test unit ringan untuk:

- validasi parsing tanggal diagnosa,
- pemisahan gejala valid dan gejala yang hilang,
- utilitas perhitungan Naive Bayes,
- mapping pesan error Prisma,
- guard role admin,
- helper seed data training.

Referensi file test:

- [src/lib/diagnosa-validation.test.ts](src/lib/diagnosa-validation.test.ts)
- [src/lib/naive-bayes-math.test.ts](src/lib/naive-bayes-math.test.ts)
- [src/lib/prisma-action-errors.test.ts](src/lib/prisma-action-errors.test.ts)
- [src/lib/session-guards.test.ts](src/lib/session-guards.test.ts)
- [prisma/seed-utils.test.ts](prisma/seed-utils.test.ts)

## Status Scan Repository

README ini disusun berdasarkan file aplikasi yang saat ini benar-benar dilacak Git, terutama:

- [package.json](package.json)
- [prisma/schema.prisma](prisma/schema.prisma)
- [prisma/seed.ts](prisma/seed.ts)
- [scripts/bootstrap-admin.ts](scripts/bootstrap-admin.ts)
- seluruh halaman aktif di [src/app](src/app)
- seluruh server action di [src/actions](src/actions)
- seluruh utilitas inti di [src/lib](src/lib)
