/*
  Warnings:

  - You are about to drop the column `poids_pourcent_dept` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.
  - You are about to drop the column `poids_pourcent_nat` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.
  - You are about to drop the column `poids_pourcent_reg` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "raw_data"."metadata_parametrage_indicateurs" DROP COLUMN "poids_pourcent_dept",
DROP COLUMN "poids_pourcent_nat",
DROP COLUMN "poids_pourcent_reg",
ADD COLUMN     "poids_pourcent_dept_decla" DOUBLE PRECISION,
ADD COLUMN     "poids_pourcent_nat_decla" DOUBLE PRECISION,
ADD COLUMN     "poids_pourcent_reg_decla" DOUBLE PRECISION;
