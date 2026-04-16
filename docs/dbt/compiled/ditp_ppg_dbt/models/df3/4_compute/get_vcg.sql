-- Pour obtenir la VCG et sa date pour chaque indicateur


WITH
-- on trie les vc NON NULL par date DEcroissante
vc_non_null_sorted AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vc,
        RANK()
            OVER (PARTITION BY indic_id, zone_id ORDER BY metric_date DESC)
            AS r
    FROM "dev_pilote__6230"."df3"."pivot_mesures"
    -- vc NON NULL
    WHERE vc IS NOT NULL
    -- vcg_max_date: aucune VC globale ne pourra dépasser cette date
    AND metric_date <= '2028-01-01'::DATE
)

SELECT
    indic_id,
    zone_id,
    metric_date AS vcg_date,
    vc AS vcg
FROM vc_non_null_sorted
WHERE r = 1