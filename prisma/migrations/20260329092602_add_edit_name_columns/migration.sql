/*
  Warnings:

  - You are about to drop the column `verificationCode` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `verificationCode`,
    ADD COLUMN `verificationToken` VARCHAR(191) NULL;
