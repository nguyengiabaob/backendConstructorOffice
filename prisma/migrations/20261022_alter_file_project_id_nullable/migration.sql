-- DropForeignKey
ALTER TABLE `File` DROP FOREIGN KEY `File_projectId_fkey`;

-- AlterTable
ALTER TABLE `File` MODIFY `projectId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

