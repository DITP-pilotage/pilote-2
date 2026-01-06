/*
  Warnings:

  - Added the required column `type` to the `referentiel_critere` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."type_critere" AS ENUM ('COMMUNICATION', 'FEUILLE_DE_ROUTE', 'SERVICES_PUBLICS', 'SIMPLIFICATION');

-- AlterTable
ALTER TABLE "public"."referentiel_critere" ADD COLUMN     "type" "public"."type_critere";
UPDATE "public".referentiel_critere SET "type" = 'COMMUNICATION' WHERE "type" IS NULL;
ALTER TABLE "public"."referentiel_critere" ALTER COLUMN    type SET NOT NULL;
