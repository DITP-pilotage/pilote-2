/*
  Warnings:

  - Added the required column `fonction_agregation` to the `indicateur_referentiel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "fonction_agregation_enum" AS ENUM ('SUM', 'NONE');

-- AlterTable
ALTER TABLE "indicateur_referentiel" ADD COLUMN     "fonction_agregation" "fonction_agregation_enum" NOT NULL;
