/*
  Warnings:

  - You are about to drop the column `amount` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `recurring` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `category` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `expenses` DROP COLUMN `amount`,
    DROP COLUMN `recurring`,
    DROP COLUMN `type`,
    ADD COLUMN `category` ENUM('fixa', 'variavel') NOT NULL,
    ADD COLUMN `value` DECIMAL(10, 2) NOT NULL;

-- CreateTable
CREATE TABLE `sales` (
    `id` CHAR(36) NOT NULL,
    `client_name` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `client_phone` VARCHAR(20) NOT NULL,
    `client_email` VARCHAR(255) NOT NULL,
    `course` VARCHAR(255) NOT NULL,
    `course_type` ENUM('presencial', 'online') NOT NULL,
    `course_value` DECIMAL(10, 2) NOT NULL,
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `taxes_value` DECIMAL(10, 2) NOT NULL,
    `commission_value` DECIMAL(10, 2) NOT NULL,
    `card_fee_value` DECIMAL(10, 2) NOT NULL,
    `total_value` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` CHAR(36) NOT NULL,

    INDEX `sales_created_by_fkey`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
