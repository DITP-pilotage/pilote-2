-- Retourne la dernière VACG pour chaque année

WITH ajout_annee AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vacg,
        date_part('year', metric_date::date) AS annee_valeur,
        row_number()
            OVER (
                PARTITION BY
                    indic_id, zone_id, date_part('year', metric_date::date)
                ORDER BY metric_date::date DESC
            )
        AS r
    FROM {{ ref('compute_vacg') }}
    WHERE vacg IS NOT NULL
)

SELECT
    indic_id,
    zone_id,
    metric_date,
    vacg,
    annee_valeur AS jalon
FROM ajout_annee
WHERE r = 1
