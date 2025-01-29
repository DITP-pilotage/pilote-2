/*
  Warnings:

  - You are about to drop the column `date_valeur_actuelle` on the `indicateur_territoire` table. All the data in the column will be lost.
  - You are about to drop the column `valeur_actuelle` on the `indicateur_territoire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."indicateur_territoire" DROP COLUMN "date_valeur_actuelle",
DROP COLUMN "valeur_actuelle",
ADD COLUMN     "date_valeur_actuelle_mandat" DATE,
ADD COLUMN     "valeur_actuelle_mandat" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."indicateur_territoire_jalon" ADD COLUMN     "date_valeur_actuelle" DATE,
ADD COLUMN     "valeur_actuelle" DOUBLE PRECISION;
