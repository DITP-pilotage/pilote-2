-- AlterTable
ALTER TABLE "public"."commentaire" ADD COLUMN     "contenu_deprecated" TEXT;

-- AlterTable
ALTER TABLE "public"."decision_strategique" ADD COLUMN     "contenu_deprecated" TEXT;

-- AlterTable
ALTER TABLE "public"."objectif" ADD COLUMN     "contenu_deprecated" TEXT;

-- AlterTable
ALTER TABLE "public"."synthese_des_resultats" ADD COLUMN     "commentaire_deprecated" TEXT;

-- Sauvegarde des valeurs plain text avant conversion
UPDATE "public"."commentaire"
SET contenu_deprecated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."decision_strategique"
SET contenu_deprecated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."objectif"
SET contenu_deprecated = contenu
WHERE contenu IS NOT NULL;

UPDATE "public"."synthese_des_resultats"
SET commentaire_deprecated = commentaire
WHERE commentaire IS NOT NULL;

