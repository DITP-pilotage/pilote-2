/*
  Warnings:

  - You are about to drop the column `zone_nom` on the `chantier` table. All the data in the column will be lost.
  - You are about to drop the column `zone_nom` on the `indicateur` table. All the data in the column will be lost.
  - Added the required column `directeur_projet` to the `chantier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `territoire_nom` to the `chantier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chantier" DROP COLUMN "zone_nom",
ADD COLUMN     "directeur_projet" TEXT NOT NULL,
ADD COLUMN     "directeurs_administration_centrale" TEXT[],
ADD COLUMN     "ministeres" TEXT[],
ADD COLUMN     "territoire_nom" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "indicateur" DROP COLUMN "zone_nom",
ADD COLUMN     "territoire_nom" TEXT;
