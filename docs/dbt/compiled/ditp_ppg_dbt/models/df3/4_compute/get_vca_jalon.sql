-- Pour obtenir les VCA et leur date respective pour chaque indicateur


WITH
-- on trie les vc NON NULL par date DEcroissante
vca_non_null_sorted AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vc,
        DATE_PART('year', metric_date) AS jalon,
        RANK()
            OVER (
                PARTITION BY
                    indic_id, zone_id, DATE_PART('year', metric_date)
                ORDER BY metric_date DESC
            )
            AS r
    FROM "dev_pilote__6230"."df3"."pivot_mesures"
    -- vc NON NULL
    WHERE vc IS NOT NULL
)

SELECT
    indic_id,
    zone_id,
    metric_date AS vca_date,
    jalon,
    vc AS vca
FROM vca_non_null_sorted
WHERE r = 1