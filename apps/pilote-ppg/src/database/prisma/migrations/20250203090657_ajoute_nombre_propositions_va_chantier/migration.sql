/*
  Warnings:

  - You are about to drop the column `possede_proposition_valeur_actuelle` on the `chantier_territoire` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chantier_territoire" DROP COLUMN "possede_proposition_valeur_actuelle",
ADD COLUMN     "nombre_propositions_valeur_actuelle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nombre_propositions_valeur_actuelle_ponderee" INTEGER NOT NULL DEFAULT 0;
