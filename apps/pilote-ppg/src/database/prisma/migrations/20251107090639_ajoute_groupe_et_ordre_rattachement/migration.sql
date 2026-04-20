-- Étape 1 : ajouter les colonnes sans contrainte NOT NULL
ALTER TABLE "public"."referentiel_rattachement"
ADD COLUMN "groupe" TEXT,
ADD COLUMN "ordre" INTEGER;

-- Étape 2 : mettre à jour les valeurs existantes
UPDATE "public"."referentiel_rattachement"
SET
    "groupe" = "code",
    "ordre" = 1;

-- Étape 3 : rendre les colonnes NOT NULL
ALTER TABLE "public"."referentiel_rattachement"
ALTER COLUMN "groupe"
SET NOT NULL,
ALTER COLUMN "ordre"
SET NOT NULL;