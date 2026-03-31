-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN "contenu_html" TEXT;

-- AlterTable
ALTER TABLE "public"."decision_strategique" ADD COLUMN "contenu_html" TEXT;

-- AlterTable
ALTER TABLE "public"."objectif" ADD COLUMN "contenu_html" TEXT;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN "contenu_html" TEXT;

-- Migration des données existantes : plain text → HTML
UPDATE "public"."commentaire"
SET "contenu_html" = '<p>' || REPLACE(REPLACE("contenu", E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE "contenu" IS NOT NULL AND "contenu" != '';

UPDATE "public"."decision_strategique"
SET "contenu_html" = '<p>' || REPLACE(REPLACE("contenu", E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE "contenu" IS NOT NULL AND "contenu" != '';

UPDATE "public"."objectif"
SET "contenu_html" = '<p>' || REPLACE(REPLACE("contenu", E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE "contenu" IS NOT NULL AND "contenu" != '';

UPDATE "public"."synthese_des_resultats"
SET "contenu_html" = '<p>' || REPLACE(REPLACE("commentaire", E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE "commentaire" IS NOT NULL AND "commentaire" != '';
