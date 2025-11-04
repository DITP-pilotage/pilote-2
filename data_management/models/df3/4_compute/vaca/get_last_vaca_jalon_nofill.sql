-- Retourne la dernière VACA pour chaque année

WITH ajout_annee AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vaca,
        is_last_monthly_va,
        date_part('year', metric_date::date) AS annee_valeur,
        row_number()
            OVER (
                PARTITION BY
                    indic_id, zone_id, date_part('year', metric_date::date)
                ORDER BY metric_date::date DESC
            )
        AS r
    FROM {{ ref('compute_vaca') }}
    WHERE vaca IS NOT NULL
)

SELECT
    indic_id,
    zone_id,
    metric_date,
    vaca,
    is_last_monthly_va,
    annee_valeur AS jalon
FROM ajout_annee
WHERE r = 1
