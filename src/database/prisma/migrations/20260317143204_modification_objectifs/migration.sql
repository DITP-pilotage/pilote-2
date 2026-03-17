-- DropForeignKey
ALTER TABLE "public"."objectif" DROP CONSTRAINT "objectif_auteur_id_fkey";

-- Ajout des nouvelles colonnes avec valeurs temporairement nullables
ALTER TABLE "public"."objectif"
ADD COLUMN "auteur_creation_id" UUID,
ADD COLUMN "auteur_modification_id" UUID,
ADD COLUMN "date_creation" TIMESTAMP,
ADD COLUMN "date_modification" TIMESTAMP,
ADD COLUMN "statut" "public"."statut_publication" NOT NULL DEFAULT 'PUBLIE';

-- Reprise des données existantes
UPDATE "public"."objectif"
SET
  auteur_modification_id = auteur_id,
  auteur_creation_id = auteur_id,
  date_modification = date,
  date_creation = date;

-- Suppression des anciennes colonnes
ALTER TABLE "public"."objectif"
DROP COLUMN "auteur_id",
DROP COLUMN "date";

-- Passage des nouvelles colonnes en NOT NULL
ALTER TABLE "public"."objectif"
ALTER COLUMN "date_creation" SET NOT NULL,
ALTER COLUMN "date_modification" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."objectif" ADD CONSTRAINT "objectif_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "public"."utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
