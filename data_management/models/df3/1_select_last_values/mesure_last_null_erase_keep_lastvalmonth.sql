{{ config(
    materialized = 'table',
) }}

-- Si plusieurs valeurs existent pour un même couple
--  {indic_id, zone_id , metric_type, mois},
-- on garde celle importée le plus récemment pour les vi, va et vc

WITH rank_values_month AS (
    SELECT
        date_import,
        indic_id,
        TO_CHAR(DATE_TRUNC('month', metric_date::DATE), 'YYYY-MM-DD')
            AS metric_date,
        metric_type,
        metric_value::FLOAT,
        zone_id,
        id,
        rapport_id,
        ROW_NUMBER() OVER (
            PARTITION BY
                indic_id,
                zone_id,
                metric_type,
                DATE_TRUNC('month', metric_date::DATE)
            ORDER BY
                date_import::TIMESTAMP DESC,
                metric_date::TIMESTAMP DESC
        ) AS r
    FROM {{ ref('mesure_last_null_erase') }}
)

SELECT *
FROM rank_values_month
WHERE r = 1
