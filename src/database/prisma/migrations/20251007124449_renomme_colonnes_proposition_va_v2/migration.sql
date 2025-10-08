-- =========================
-- Table 1 : chantier_territoire
-- =========================
ALTER TABLE "public"."chantier_territoire"
ADD COLUMN "nombre_propositions_valeur_actuelle" INTEGER DEFAULT 0,
ADD COLUMN "nombre_propositions_valeur_actuelle_ponderee" INTEGER DEFAULT 0;

UPDATE "public"."chantier_territoire"
SET
    "nombre_propositions_valeur_actuelle" = "nombre_propositions_valeur_actuelle_v2",
    "nombre_propositions_valeur_actuelle_ponderee" = "nombre_propositions_valeur_actuelle_ponderee_v2";

ALTER TABLE "public"."chantier_territoire"
ALTER COLUMN "nombre_propositions_valeur_actuelle"
SET NOT NULL,
ALTER COLUMN "nombre_propositions_valeur_actuelle_ponderee"
SET NOT NULL;

ALTER TABLE "public"."chantier_territoire"
DROP COLUMN "nombre_propositions_valeur_actuelle_v2",
DROP COLUMN "nombre_propositions_valeur_actuelle_ponderee_v2";

-- =========================
-- Table 2 : indicateur_territoire
-- =========================
ALTER TABLE "public"."indicateur_territoire"
ADD COLUMN "taux_avancement_mandat_proposition" DOUBLE PRECISION;

UPDATE "public"."indicateur_territoire"
SET
    "taux_avancement_mandat_proposition" = "taux_avancement_mandat_proposition_v2";

ALTER TABLE "public"."indicateur_territoire"
DROP COLUMN "taux_avancement_mandat_proposition_v2";

-- =========================
-- Table 3 : indicateur_territoire_jalon
-- =========================
ALTER TABLE "public"."indicateur_territoire_jalon"
ADD COLUMN "taux_avancement_proposition" DOUBLE PRECISION;

UPDATE "public"."indicateur_territoire_jalon"
SET
    "taux_avancement_proposition" = "taux_avancement_proposition_v2";

ALTER TABLE "public"."indicateur_territoire_jalon"
DROP COLUMN "taux_avancement_proposition_v2";