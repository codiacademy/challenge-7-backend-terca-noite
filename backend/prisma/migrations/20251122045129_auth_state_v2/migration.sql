/*
  Warnings:

  - The primary key for the `authstate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `state` on the `authstate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.

*/
-- DropIndex
DROP INDEX `AuthState_state_key` ON `authstate`;

-- AlterTable
ALTER TABLE `authstate` DROP PRIMARY KEY,
    MODIFY `state` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`state`);
