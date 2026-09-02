-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NULL,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL;
