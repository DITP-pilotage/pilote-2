-- Étape 1 : retirer les PKs (incluent la colonne action, de type enum)
ALTER TABLE "indicateur_permission" DROP CONSTRAINT "indicateur_permission_pkey";
ALTER TABLE "collection_permission" DROP CONSTRAINT "collection_permission_pkey";

-- Étape 2 : convertir les colonnes action en text (libère la dépendance sur le type enum)
ALTER TABLE "indicateur_permission" ALTER COLUMN "action" TYPE text;
ALTER TABLE "collection_permission" ALTER COLUMN "action" TYPE text;

-- Étape 3 : supprimer l'ancien enum
DROP TYPE "permission_action_enum";

-- Étape 4 : créer les deux nouveaux enums
CREATE TYPE "indicateur_permission_action_enum" AS ENUM ('READ', 'WRITE_DATA', 'WRITE_COMMENT');
CREATE TYPE "collection_permission_action_enum" AS ENUM ('READ', 'WRITE_COMMENT');

-- Étape 5 : recaster les colonnes vers les nouveaux enums
ALTER TABLE "indicateur_permission"
  ALTER COLUMN "action" TYPE "indicateur_permission_action_enum"
  USING "action"::"indicateur_permission_action_enum";

ALTER TABLE "collection_permission"
  ALTER COLUMN "action" TYPE "collection_permission_action_enum"
  USING "action"::"collection_permission_action_enum";

-- Étape 6 : recréer les PKs
ALTER TABLE "indicateur_permission"
  ADD CONSTRAINT "indicateur_permission_pkey" PRIMARY KEY (principal_id, indicateur_id, action);

ALTER TABLE "collection_permission"
  ADD CONSTRAINT "collection_permission_pkey" PRIMARY KEY (principal_id, collection_id, action);
