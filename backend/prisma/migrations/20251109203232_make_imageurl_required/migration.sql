/*
  Warnings:

  - You are about to drop the column `description` on the `TierItem` table. All the data in the column will be lost.
  - Made the column `imageUrl` on table `TierItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TierItem" DROP COLUMN "description",
ALTER COLUMN "imageUrl" SET NOT NULL;
