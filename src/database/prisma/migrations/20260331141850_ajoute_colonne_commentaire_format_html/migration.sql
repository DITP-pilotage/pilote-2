-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN     "contenu_depracated" TEXT;

-- AlterTable
ALTER TABLE "public"."decision_strategique" ADD COLUMN     "contenu_depracated" TEXT;

-- AlterTable
ALTER TABLE "public"."objectif" ADD COLUMN     "contenu_depracated" TEXT;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN     "commentaire_depracated" TEXT;

-- Sauvegarde des valeurs plain text avant conversion
UPDATE "public"."commentaire"
SET contenu_depracated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."decision_strategique"
SET contenu_depracated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."objectif"
SET contenu_depracated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."synthese_des_resultats"
SET commentaire_depracated = commentaire
WHERE commentaire IS NOT NULL;

-- Conversion plain text → HTML dans les colonnes principales
UPDATE "public"."commentaire"
SET contenu = '<p>' || REPLACE(REPLACE(contenu, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE contenu IS NOT NULL;

UPDATE "public"."decision_strategique"
SET contenu = '<p>' || REPLACE(REPLACE(contenu, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE contenu IS NOT NULL;

UPDATE "public"."objectif"
SET contenu = '<p>' || REPLACE(REPLACE(contenu, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE contenu IS NOT NULL;

UPDATE "public"."synthese_des_resultats"
SET commentaire = '<p>' || REPLACE(REPLACE(commentaire, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE commentaire IS NOT NULL;
