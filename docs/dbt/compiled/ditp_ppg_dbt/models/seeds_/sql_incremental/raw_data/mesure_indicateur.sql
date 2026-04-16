-- depends_on: "dev_pilote__6230"."public"."rapport_import_mesure_indicateur"

SELECT
    date_import::TIMESTAMPTZ (3),
    indic_id,
    metric_date,
    metric_type,
    metric_value,
    zone_id,
    id::UUID,
    rapport_id::UUID

FROM "dev_pilote__6230"."seeds"."mesure_indicateur_py"