/*
  Warnings:

  - You are about to drop the column `commentaire` on the `metadata_indicateurs_complementaire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "raw_data"."metadata_indicateurs_complementaire" ADD COLUMN     "cible_attendue" TEXT,
ADD COLUMN     "couverture_temporelle" TEXT,
ADD COLUMN     "maille_pilotage" TEXT;
