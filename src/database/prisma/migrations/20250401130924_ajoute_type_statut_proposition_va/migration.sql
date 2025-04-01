-- CreateEnum
CREATE TYPE "public"."type_statut_proposition" AS ENUM ('EN_COURS', 'RETIREE', 'ANNULEE', 'ACCEPTEE_VIA_IMPORT', 'TRAITEE_VIA_IMPORT', 'IGNOREE_VIA_IMPORT');

-- AlterTable
ALTER TABLE "public"."proposition_valeur_actuelle"
ADD COLUMN "statut_tmp" "public"."type_statut_proposition";

UPDATE "public"."proposition_valeur_actuelle"
SET "statut_tmp" = "statut"::"public"."type_statut_proposition";

ALTER TABLE "public"."proposition_valeur_actuelle"
DROP COLUMN "statut";

ALTER TABLE "public"."proposition_valeur_actuelle"
RENAME COLUMN "statut_tmp" TO "statut";

ALTER TABLE "public"."proposition_valeur_actuelle"
ALTER COLUMN "statut" SET NOT NULL;