-- RenameEnum: préserve toutes les valeurs existantes dans synthese_des_resultats.statut
ALTER TYPE "public"."statut_synthese_des_resultats" RENAME TO "statut_publication";

-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_auteur_id_fkey";

-- AlterTable: ajout des nouvelles colonnes en nullable pour permettre la copie des données
ALTER TABLE "public"."commentaire"
ADD COLUMN "auteur_creation_id"     UUID,
ADD COLUMN "auteur_modification_id" UUID,
ADD COLUMN "date_creation"          TIMESTAMP,
ADD COLUMN "date_modification"      TIMESTAMP,
ADD COLUMN "statut"                 "public"."statut_publication" NOT NULL DEFAULT 'PUBLIE';

-- CopyData: copie auteur_id et date vers les nouvelles colonnes
UPDATE "public"."commentaire" SET
  "auteur_creation_id"     = "auteur_id",
  "auteur_modification_id" = "auteur_id",
  "date_creation"          = "date",
  "date_modification"      = "date";

-- SetNotNull
ALTER TABLE "public"."commentaire"
ALTER COLUMN "date_creation"     SET NOT NULL,
ALTER COLUMN "date_modification" SET NOT NULL;

-- DropColumns
ALTER TABLE "public"."commentaire"
DROP COLUMN "auteur_id",
DROP COLUMN "date";

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaire" ADD CONSTRAINT "commentaire_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
