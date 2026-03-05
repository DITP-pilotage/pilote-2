

WITH unnest_json_array AS (
    SELECT
        id,
        territoire_code,
        JSONB_ARRAY_ELEMENTS(
            evolution_avancement
        ) AS evolution_avancement_unnest
    FROM "dev_pilote__6230"."public"."indicateur_territoire"
)

SELECT
    id,
    territoire_code,
    --evolution_valeur_actuelle_unnest,
    (evolution_avancement_unnest ->> 'valeur')
    ::NUMERIC AS va_unnest_computed,
    (evolution_avancement_unnest ->> 'date')
    ::DATE AS va_date_unnest_computed,
    (evolution_avancement_unnest ->> 'taux_avancement_jalon')
    ::NUMERIC AS taux_avancement_jalon_unnest_computed,
    (evolution_avancement_unnest ->> 'taux_avancement_mandat')
    ::NUMERIC AS taux_avancement_mandat_unnest_computed
FROM unnest_json_array