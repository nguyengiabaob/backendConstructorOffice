-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `projectId` INTEGER NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK') NOT NULL DEFAULT 'TASK',
    `status` ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE') NOT NULL DEFAULT 'TODO',
    `priority` ENUM('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST') NOT NULL DEFAULT 'MEDIUM',
    `assigneeId` INTEGER NULL,
    `reporterId` INTEGER NOT NULL,
    `parentTaskId` INTEGER NULL,
    `labels` JSON NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `storyPoints` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Task_key_key`(`key`),
    INDEX `Task_projectId_idx`(`projectId`),
    INDEX `Task_reporterId_idx`(`reporterId`),
    INDEX `Task_assigneeId_idx`(`assigneeId`),
    INDEX `Task_parentTaskId_idx`(`parentTaskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_parentTaskId_fkey` FOREIGN KEY (`parentTaskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
