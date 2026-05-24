-- AlterTable
ALTER TABLE `user` ADD COLUMN `isActive` BOOLEAN NULL,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL;
