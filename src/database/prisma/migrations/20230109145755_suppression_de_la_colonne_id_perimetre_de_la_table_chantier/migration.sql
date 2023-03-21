/*
  Warnings:

  - You are about to drop the column `id_perimetre` on the `chantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chantier" DROP COLUMN "id_perimetre",
ALTER COLUMN "territoire_nom" DROP NOT NULL,
ALTER COLUMN "directeur_projet" DROP DEFAULT;
