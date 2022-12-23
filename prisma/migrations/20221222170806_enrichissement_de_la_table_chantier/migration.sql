/*
  Warnings:

  - Added the required column `code_insee` to the `chantier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_nom` to the `chantier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chantier" ADD COLUMN     "code_insee" TEXT NOT NULL,
ADD COLUMN     "taux_avancement" DOUBLE PRECISION,
ADD COLUMN     "zone_nom" TEXT NOT NULL;
