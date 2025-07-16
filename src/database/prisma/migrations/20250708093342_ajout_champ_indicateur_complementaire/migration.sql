/*
  Warnings:

  - You are about to drop the column `commentaire` on the `metadata_indicateurs_complementaire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "raw_data"."metadata_indicateurs_complementaire" ADD COLUMN     "cible_attendue" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "couverture_temporelle" TEXT NOT NULL DEFAULT 'continue',
ADD COLUMN     "maille_pilotage" TEXT NOT NULL DEFAULT '_';
