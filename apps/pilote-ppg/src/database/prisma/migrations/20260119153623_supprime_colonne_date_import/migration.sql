/*
  Warnings:

  - You are about to drop the column `dernier_import_date_indic` on the `indicateur_identite` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."indicateur_identite" DROP COLUMN "dernier_import_date_indic";
