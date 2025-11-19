ALTER TABLE "public"."indicateur_territoire"
ADD COLUMN "evolution_avancement" JSONB;

UPDATE "public"."indicateur_territoire"
SET
    "evolution_avancement" = "evolution_valeur_actuelle";

ALTER TABLE "public"."indicateur_territoire"
DROP COLUMN "evolution_valeur_actuelle";
