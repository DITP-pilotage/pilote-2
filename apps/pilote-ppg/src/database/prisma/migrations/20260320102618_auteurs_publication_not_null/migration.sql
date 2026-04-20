/*
  Warnings:

  - Made the column `auteur_creation_id` on table `commentaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_modification_id` on table `commentaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_creation_id` on table `decision_strategique` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_modification_id` on table `decision_strategique` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_creation_id` on table `objectif` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_modification_id` on table `objectif` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_creation_id` on table `synthese_des_resultats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auteur_modification_id` on table `synthese_des_resultats` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_auteur_creation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_auteur_modification_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."decision_strategique" DROP CONSTRAINT "decision_strategique_auteur_creation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."decision_strategique" DROP CONSTRAINT "decision_strategique_auteur_modification_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."objectif" DROP CONSTRAINT "objectif_auteur_creation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."objectif" DROP CONSTRAINT "objectif_auteur_modification_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_auteur_creation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."synthese_des_resultats" DROP CONSTRAINT "synthese_des_resultats_auteur_modification_id_fkey";

-- AlterTable
ALTER TABLE "public"."commentaire" ALTER COLUMN "auteur_creation_id" SET NOT NULL,
ALTER COLUMN "auteur_modification_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."decision_strategique" ALTER COLUMN "auteur_creation_id" SET NOT NULL,
ALTER COLUMN "auteur_modification_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."objectif" ALTER COLUMN "auteur_creation_id" SET NOT NULL,
ALTER COLUMN "auteur_modification_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ALTER COLUMN "auteur_creation_id" SET NOT NULL,
ALTER COLUMN "auteur_modification_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."synthese_des_resultats" ADD CONSTRAINT "synthese_des_resultats_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
