/*
  Warnings:

  - A unique constraint covering the columns `[discordId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `discordId` VARCHAR(255) NULL,
    ADD COLUMN `discordName` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_discordId_key` ON `users`(`discordId`);
