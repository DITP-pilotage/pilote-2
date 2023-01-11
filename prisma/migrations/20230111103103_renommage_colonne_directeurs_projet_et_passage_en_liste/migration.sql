/*
  Warnings:

  - You are about to drop the column `directeur_projet` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chantier" DROP COLUMN "directeur_projet",
ADD COLUMN     "directeurs_projet" TEXT[];
