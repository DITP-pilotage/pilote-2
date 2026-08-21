-- Création du type enum porteur_type
CREATE TYPE "raw_data"."porteur_type" AS ENUM ('MIN', 'DAC', 'AUTRE');

-- Ajout de la nouvelle colonne typée enum
ALTER TABLE "raw_data"."metadata_porteurs"
  ADD COLUMN "porteur_type" "raw_data"."porteur_type";

-- Backfill depuis porteur_type_short
UPDATE "raw_data"."metadata_porteurs"
  SET "porteur_type" = "porteur_type_short"::"raw_data"."porteur_type";

-- Passage en NOT NULL
ALTER TABLE "raw_data"."metadata_porteurs"
  ALTER COLUMN "porteur_type" SET NOT NULL;

-- Suppression des anciennes colonnes
ALTER TABLE "raw_data"."metadata_porteurs"
  DROP COLUMN "porteur_type_short";

ALTER TABLE "raw_data"."metadata_porteurs"
  DROP COLUMN "porteur_type_id";
