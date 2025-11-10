{{ config(materialized='table') }}

WITH unnest_json_array AS (
    SELECT
        id,
        territoire_code,
        JSONB_ARRAY_ELEMENTS(
            evolution_valeur_actuelle
        ) AS evolution_valeur_actuelle_unnest
    FROM {{ ref('indicateur_territoire') }}
)

SELECT
    id,
    territoire_code,
    --evolution_valeur_actuelle_unnest,
    (evolution_valeur_actuelle_unnest ->> 'valeur')
    ::NUMERIC AS va_unnest_computed,
    (evolution_valeur_actuelle_unnest ->> 'date')
    ::DATE AS va_date_unnest_computed,
    (evolution_valeur_actuelle_unnest ->> 'taa')
    ::NUMERIC AS taa_unnest_computed,
    (evolution_valeur_actuelle_unnest ->> 'tag')
    ::NUMERIC AS tag_unnest_computed
FROM unnest_json_array
