/*
  Warnings:

  - You are about to drop the column `ponderation_dept` on the `indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `ponderation_nat` on the `indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `ponderation_reg` on the `indicateur` table. All the data in the column will be lost.
  - You are about to drop the column `poids_pourcent_dept_decla` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.
  - You are about to drop the column `poids_pourcent_nat_decla` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.
  - You are about to drop the column `poids_pourcent_reg_decla` on the `metadata_parametrage_indicateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."indicateur" DROP COLUMN "ponderation_dept",
DROP COLUMN "ponderation_nat",
DROP COLUMN "ponderation_reg",
ADD COLUMN     "ponderation_zone_declaree" DOUBLE PRECISION,
ADD COLUMN     "ponderation_zone_reel" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "raw_data"."metadata_parametrage_indicateurs" DROP COLUMN "poids_pourcent_dept_decla",
DROP COLUMN "poids_pourcent_nat_decla",
DROP COLUMN "poids_pourcent_reg_decla",
ADD COLUMN     "poids_pourcent_dept_declaree" DOUBLE PRECISION,
ADD COLUMN     "poids_pourcent_nat_declaree" DOUBLE PRECISION,
ADD COLUMN     "poids_pourcent_reg_declaree" DOUBLE PRECISION;
