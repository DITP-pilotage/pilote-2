-- Étape 1 : libérer les colonnes du type enum pour pouvoir écrire librement
ALTER TABLE "indicateur_permission" ALTER COLUMN "action" TYPE text;
ALTER TABLE "collection_permission" ALTER COLUMN "action" TYPE text;

-- Étape 2 : supprimer l'ancien enum (colonnes en text, plus de dépendance)
DROP TYPE "permission_action_enum";

-- Étape 3 : créer le nouvel enum
CREATE TYPE "permission_action_enum" AS ENUM ('READ', 'WRITE_DATA', 'WRITE_COMMENT');

-- Étape 4 : convertir les données (colonnes en text, toutes valeurs acceptées)
UPDATE "collection_permission" SET action = 'WRITE_COMMENT' WHERE action = 'WRITE';

INSERT INTO "indicateur_permission" (principal_id, indicateur_id, action, created_at)
  SELECT principal_id, indicateur_id, 'WRITE_COMMENT', created_at
  FROM "indicateur_permission" WHERE action = 'WRITE';

UPDATE "indicateur_permission" SET action = 'WRITE_DATA' WHERE action = 'WRITE';

-- Étape 5 : recaster les colonnes vers le nouvel enum (plus de valeur WRITE en base)
ALTER TABLE "indicateur_permission"
  ALTER COLUMN "action" TYPE "permission_action_enum"
  USING "action"::"permission_action_enum";

ALTER TABLE "collection_permission"
  ALTER COLUMN "action" TYPE "permission_action_enum"
  USING "action"::"permission_action_enum";
