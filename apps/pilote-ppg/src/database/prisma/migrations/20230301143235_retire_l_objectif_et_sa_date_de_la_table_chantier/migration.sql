/*
  Warnings:

  - You are about to drop the column `date_objectifs` on the `chantier` table. All the data in the column will be lost.
  - You are about to drop the column `objectifs` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chantier" DROP COLUMN "date_objectifs",
DROP COLUMN "objectifs";
