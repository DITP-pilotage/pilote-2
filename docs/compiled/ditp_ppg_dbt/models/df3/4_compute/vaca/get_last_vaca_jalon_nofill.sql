-- Retourne la dernière VACA pour chaque année

WITH ajout_annee AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vaca,
        DATE_PART('year', metric_date) AS annee_valeur,
        ROW_NUMBER()
            OVER (
                PARTITION BY
                    indic_id,
                    zone_id,
                    DATE_PART('year', metric_date)
                ORDER BY metric_date DESC
            )
            AS r
    FROM "dev_pilote__6230"."df3"."compute_vaca"
    WHERE vaca IS NOT NULL
)

SELECT
    indic_id,
    zone_id,
    metric_date,
    vaca,
    annee_valeur AS jalon
FROM ajout_annee
WHERE r = 1