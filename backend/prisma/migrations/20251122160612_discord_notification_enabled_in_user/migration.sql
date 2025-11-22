/*
  Warnings:

  - You are about to drop the column `notification_sms_enabled` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `notification_sms_enabled`,
    ADD COLUMN `notification_discord_enabled` BOOLEAN NOT NULL DEFAULT false;
