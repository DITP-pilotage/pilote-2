{{ config(materialized='table') }}

WITH unnest_json_array AS (
    SELECT
        id,
        territoire_code,
        jsonb_array_elements(
            evolution_valeur_actuelle
        ) AS evolution_valeur_actuelle_unnest
    FROM {{ ref('df3_indicateur') }}
)

SELECT
    id,
    territoire_code,
    --evolution_valeur_actuelle_unnest,
    (evolution_valeur_actuelle_unnest ->> 'vaca')
    ::numeric AS va_unnest_computed,
    (evolution_valeur_actuelle_unnest ->> 'date')
    ::date AS va_date_unnest_computed
FROM unnest_json_array
