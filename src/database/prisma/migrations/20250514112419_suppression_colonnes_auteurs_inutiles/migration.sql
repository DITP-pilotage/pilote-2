/*
  Warnings:

  - You are about to drop the column `auteur` on the `commentaire` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `decision_strategique` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `objectif` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_modification` on the `proposition_valeur_actuelle` table. All the data in the column will be lost.
  - You are about to drop the column `auteur` on the `synthese_des_resultats` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_email_creation` on the `utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `auteur_email_modification` on the `utilisateur` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."commentaire" DROP COLUMN "auteur";

-- AlterTable
ALTER TABLE "public"."decision_strategique" DROP COLUMN "auteur";

-- AlterTable
ALTER TABLE "public"."objectif" DROP COLUMN "auteur";

-- AlterTable
ALTER TABLE "public"."proposition_valeur_actuelle" DROP COLUMN "auteur_modification" CASCADE;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" DROP COLUMN "auteur";

-- AlterTable
ALTER TABLE "public"."utilisateur" DROP COLUMN "auteur_email_creation",
DROP COLUMN "auteur_email_modification";
