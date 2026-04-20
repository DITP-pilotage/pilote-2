/*
  Warnings:

  - You are about to drop the column `objectif_date_valeur_cible` on the `indicateur` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."indicateur" DROP COLUMN "objectif_date_valeur_cible";

ALTER TABLE "public"."indicateur" RENAME COLUMN "objectif_date_valeur_cible_2"
TO "objectif_date_valeur_cible";
