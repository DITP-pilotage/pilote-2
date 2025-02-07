-- Pour obtenir les VCA et leur date respective pour chaque indicateur


WITH
-- on trie les vc NON NULL par date DEcroissante
vca_non_null_sorted AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vc,
        date_part('year', metric_date::date) AS jalon,
        rank()
            OVER (
                PARTITION BY
                    indic_id, zone_id, date_part('year', metric_date::date)
                ORDER BY metric_date DESC
            )
        AS r
    FROM {{ ref('pivot_mesures') }}
    -- vc NON NULL
    WHERE vc IS NOT null
)


SELECT
    indic_id,
    zone_id,
    metric_date AS vca_date,
    jalon,
    vc AS vca
FROM vca_non_null_sorted
WHERE r = 1
