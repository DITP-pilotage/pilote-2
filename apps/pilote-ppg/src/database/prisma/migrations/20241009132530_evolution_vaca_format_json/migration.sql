/*
  Warnings:

  - You are about to drop the column `evolution_date_valeur_actuelle` on the `indicateur` table. All the data in the column will be lost.
  - The `evolution_valeur_actuelle` column on the `indicateur` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."indicateur" DROP COLUMN "evolution_date_valeur_actuelle" CASCADE,
DROP COLUMN "evolution_valeur_actuelle" CASCADE,
ADD COLUMN     "evolution_valeur_actuelle" JSONB;
