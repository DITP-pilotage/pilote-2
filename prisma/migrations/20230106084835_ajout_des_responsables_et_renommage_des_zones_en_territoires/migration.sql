/*
  Warnings:

  - You are about to drop the column `zone_nom` on the `chantier` table. All the data in the column will be lost.
  - You are about to drop the column `zone_nom` on the `indicateur` table. All the data in the column will be lost.
  - Added the required column `directeur_projet` to the `chantier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `territoire_nom` to the `chantier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chantier"
RENAME COLUMN "zone_nom" TO "territoire_nom";

ALTER TABLE "chantier"
ADD COLUMN     "directeur_projet" TEXT NOT NULL DEFAULT 'non connu',
ADD COLUMN     "directeurs_administration_centrale" TEXT[],
ADD COLUMN     "ministeres" TEXT[];

-- AlterTable
ALTER TABLE "indicateur"
RENAME COLUMN "zone_nom" TO "territoire_nom";
