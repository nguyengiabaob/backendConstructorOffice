CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `projectCode` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNING',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `budget` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `expectedPersonnel` INTEGER NOT NULL DEFAULT 1,
    `imageUrl` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `participantIds` JSON NOT NULL,
    `managerIds` JSON NOT NULL,
    `createdBy` INTEGER NOT NULL,
    `modifiedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDelete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Project_projectCode_key`(`projectCode`),
    INDEX `Project_createdBy_idx`(`createdBy`),
    INDEX `Project_modifiedBy_idx`(`modifiedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Project` ADD CONSTRAINT `Project_createdBy_fkey`
    FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Project` ADD CONSTRAINT `Project_modifiedBy_fkey`
    FOREIGN KEY (`modifiedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
