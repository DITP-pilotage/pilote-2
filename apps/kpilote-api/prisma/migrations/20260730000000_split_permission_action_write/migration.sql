-- Étape 1 : supprimer toutes les lignes WRITE (seeds uniquement, pas de données réelles)
DELETE FROM "indicateur_permission" WHERE action = 'WRITE';
DELETE FROM "collection_permission" WHERE action = 'WRITE';

-- Étape 2 : recréer l'enum entier (PostgreSQL ne supporte pas DROP VALUE)
ALTER TYPE "permission_action_enum" RENAME TO "permission_action_enum_old";

CREATE TYPE "permission_action_enum" AS ENUM ('READ', 'WRITE_DATA', 'WRITE_COMMENT');

ALTER TABLE "indicateur_permission"
  ALTER COLUMN "action" TYPE "permission_action_enum"
  USING "action"::text::"permission_action_enum";

ALTER TABLE "collection_permission"
  ALTER COLUMN "action" TYPE "permission_action_enum"
  USING "action"::text::"permission_action_enum";

-- Étape 3 : supprimer l'ancien type
DROP TYPE "permission_action_enum_old";
