/*
  Warnings:

  - You are about to drop the `proposition_valeur_actuelle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" DROP CONSTRAINT "proposition_valeur_actuelle_id_auteur_modification_fkey";

-- DropForeignKey
ALTER TABLE "public"."proposition_valeur_actuelle" DROP CONSTRAINT "proposition_valeur_actuelle_indic_id_territoire_code_fkey";

-- DropTable
DROP TABLE "public"."proposition_valeur_actuelle";

-- DropEnum
DROP TYPE "public"."type_statut_proposition";
