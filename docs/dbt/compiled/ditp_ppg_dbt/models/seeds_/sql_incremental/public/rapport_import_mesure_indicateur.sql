-- depends_on: "dev_pilote__6230"."public"."utilisateur"

SELECT
    id::UUID,
    date_creation::TIMESTAMPTZ,
    utilisateur_email,
    est_valide::BOOL
FROM "dev_pilote__6230"."seeds"."rapport_import_mesure_indicateur_py"