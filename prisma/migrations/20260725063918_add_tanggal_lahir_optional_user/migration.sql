-- DropForeignKey
ALTER TABLE `diagnosisbalita` DROP FOREIGN KEY `DiagnosisBalita_userId_fkey`;

-- AlterTable
ALTER TABLE `diagnosisbalita` ADD COLUMN `tanggalLahir` DATETIME(3) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `DiagnosisBalita` ADD CONSTRAINT `DiagnosisBalita_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
