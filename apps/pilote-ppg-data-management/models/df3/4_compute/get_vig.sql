-- Pour obtenir la VIG et sa date pour chaque indicateur
-- Il s'agit de la 1e VI


WITH
-- on trie les vi NON NULL par date croissante
vi_non_null_sorted AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vi,
        RANK()
            OVER (
                PARTITION BY indic_id, zone_id
                ORDER BY date_import DESC, metric_date ASC, RANDOM()
            )
            AS r
    FROM {{ ref('pivot_mesures') }}
    -- vi NON NULL
    WHERE vi IS NOT NULL
    -- vig_min_date: aucune VI globale ne pourra être avant cette date
    AND metric_date >= '{{ var('vig_min_date') }}'::DATE
)

-- La première VI pour chaque [indic,zone]

SELECT
    TRUE AS is_from_vi, -- legacy: pouvait être la 1e va par le passé
    indic_id,
    zone_id,
    metric_date AS vig_date,
    vi AS vig
FROM vi_non_null_sorted
WHERE r = 1
