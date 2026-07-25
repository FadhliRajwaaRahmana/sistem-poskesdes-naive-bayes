-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `displayUsername` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT true,
    `image` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_username_key`(`username`),
    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `idToken` VARCHAR(191) NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Penyakit` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NULL,
    `saranPenanganan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Penyakit_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gejala` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Gejala_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PenyakitGejala` (
    `id` VARCHAR(191) NOT NULL,
    `penyakitId` VARCHAR(191) NOT NULL,
    `gejalaId` VARCHAR(191) NOT NULL,
    `likelihood` DOUBLE NOT NULL,

    INDEX `PenyakitGejala_gejalaId_idx`(`gejalaId`),
    UNIQUE INDEX `PenyakitGejala_penyakitId_gejalaId_key`(`penyakitId`, `gejalaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StandarPertumbuhan` (
    `id` VARCHAR(191) NOT NULL,
    `umurBulan` INTEGER NOT NULL,
    `jenisKelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    `bbMin` DOUBLE NOT NULL,
    `bbMax` DOUBLE NOT NULL,
    `tbMin` DOUBLE NOT NULL,
    `tbMax` DOUBLE NOT NULL,

    UNIQUE INDEX `StandarPertumbuhan_umurBulan_jenisKelamin_key`(`umurBulan`, `jenisKelamin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosisBalita` (
    `id` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `namaBalita` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NOT NULL,
    `jenisKelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    `namaIbu` VARCHAR(191) NOT NULL,
    `dusun` VARCHAR(191) NOT NULL,
    `umurBulan` INTEGER NOT NULL,
    `beratBadan` DOUBLE NOT NULL,
    `tinggiBadan` DOUBLE NOT NULL,
    `lila` DOUBLE NULL,
    `hasilDiagnosis` VARCHAR(191) NOT NULL,
    `penyakitId` VARCHAR(191) NULL,
    `keterangan` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiagnosisBalita_tanggal_idx`(`tanggal`),
    INDEX `DiagnosisBalita_penyakitId_idx`(`penyakitId`),
    INDEX `DiagnosisBalita_userId_idx`(`userId`),
    INDEX `DiagnosisBalita_nik_idx`(`nik`),
    INDEX `DiagnosisBalita_dusun_idx`(`dusun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosisGejala` (
    `id` VARCHAR(191) NOT NULL,
    `diagnosisId` VARCHAR(191) NOT NULL,
    `gejalaId` VARCHAR(191) NOT NULL,

    INDEX `DiagnosisGejala_gejalaId_idx`(`gejalaId`),
    UNIQUE INDEX `DiagnosisGejala_diagnosisId_gejalaId_key`(`diagnosisId`, `gejalaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosisRanking` (
    `id` VARCHAR(191) NOT NULL,
    `diagnosisId` VARCHAR(191) NOT NULL,
    `penyakitId` VARCHAR(191) NULL,
    `kodePenyakit` VARCHAR(191) NOT NULL,
    `namaPenyakit` VARCHAR(191) NOT NULL,
    `prior` DOUBLE NOT NULL,
    `posterior` DOUBLE NOT NULL,
    `score` DOUBLE NOT NULL,
    `peringkat` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiagnosisRanking_diagnosisId_idx`(`diagnosisId`),
    INDEX `DiagnosisRanking_penyakitId_idx`(`penyakitId`),
    UNIQUE INDEX `DiagnosisRanking_diagnosisId_peringkat_key`(`diagnosisId`, `peringkat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PenyakitGejala` ADD CONSTRAINT `PenyakitGejala_penyakitId_fkey` FOREIGN KEY (`penyakitId`) REFERENCES `Penyakit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PenyakitGejala` ADD CONSTRAINT `PenyakitGejala_gejalaId_fkey` FOREIGN KEY (`gejalaId`) REFERENCES `Gejala`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisBalita` ADD CONSTRAINT `DiagnosisBalita_penyakitId_fkey` FOREIGN KEY (`penyakitId`) REFERENCES `Penyakit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisBalita` ADD CONSTRAINT `DiagnosisBalita_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisGejala` ADD CONSTRAINT `DiagnosisGejala_diagnosisId_fkey` FOREIGN KEY (`diagnosisId`) REFERENCES `DiagnosisBalita`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisGejala` ADD CONSTRAINT `DiagnosisGejala_gejalaId_fkey` FOREIGN KEY (`gejalaId`) REFERENCES `Gejala`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisRanking` ADD CONSTRAINT `DiagnosisRanking_diagnosisId_fkey` FOREIGN KEY (`diagnosisId`) REFERENCES `DiagnosisBalita`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosisRanking` ADD CONSTRAINT `DiagnosisRanking_penyakitId_fkey` FOREIGN KEY (`penyakitId`) REFERENCES `Penyakit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
