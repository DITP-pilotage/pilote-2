/*
  Warnings:

  - You are about to drop the column `auteur_id` on the `decision_strategique` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `decision_strategique` table. All the data in the column will be lost.
  - Added the required column `date_creation` to the `decision_strategique` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_modification` to the `decision_strategique` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."decision_strategique" DROP CONSTRAINT "decision_strategique_auteur_id_fkey";

-- AlterTable: ajout des nouvelles colonnes en nullable pour permettre la copie des données
ALTER TABLE "public"."decision_strategique"
ADD COLUMN "auteur_creation_id"     UUID,
ADD COLUMN "auteur_modification_id" UUID,
ADD COLUMN "date_creation"          TIMESTAMP,
ADD COLUMN "date_modification"      TIMESTAMP,
ADD COLUMN "statut"                 "public"."statut_publication" NOT NULL DEFAULT 'PUBLIE';

-- CopyData: copie auteur_id et date vers les nouvelles colonnes
UPDATE "public"."decision_strategique" SET
  "auteur_creation_id"     = "auteur_id",
  "auteur_modification_id" = "auteur_id",
  "date_creation"          = "date",
  "date_modification"      = "date";

-- SetNotNull
ALTER TABLE "public"."decision_strategique"
ALTER COLUMN "date_creation"     SET NOT NULL,
ALTER COLUMN "date_modification" SET NOT NULL;

-- DropColumns
ALTER TABLE "public"."decision_strategique"
DROP COLUMN "auteur_id",
DROP COLUMN "date";

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decision_strategique" ADD CONSTRAINT "decision_strategique_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
