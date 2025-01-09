/*
  Warnings:

  - You are about to drop the column `auteur` on the `commentaire` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `decision_strategique` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `objectif` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `synthese_des_resultats` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_email_creation` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_email_modification` on the `utilisateur` table. All the data in the column will be lost.
  - Made the column `auteur_id` on table `commentaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_id` on table `decision_strategique` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_id` on table `objectif` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_id` on table `synthese_des_resultats` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."commentaire" DROP COLUMN "auteur",
ALTER COLUMN "auteur_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."decision_strategique" DROP COLUMN "auteur",
ALTER COLUMN "auteur_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."objectif" DROP COLUMN "auteur",
ALTER COLUMN "auteur_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" DROP COLUMN "auteur",
ALTER COLUMN "auteur_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."utilisateur" DROP COLUMN "auteur_email_creation",
DROP COLUMN "auteur_email_modification";
