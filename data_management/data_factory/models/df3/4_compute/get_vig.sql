-- Pour obtenir la VIG et sa date pour chaque indicateur
-- Il s'agit de la 1e VI OU de la 1e VA si aucune VI n'existe


WITH
-- on trie les vi NON NULL par date croissante
vi_non_null_sorted AS (
    SELECT
        indic_id,
        zone_id,
        metric_date,
        vi,
        rank()
            OVER (PARTITION BY indic_id, zone_id ORDER BY date_import DESC, metric_date ASC, random())
        AS r
    FROM {{ ref('pivot_mesures') }}
    -- vi NON NULL
    WHERE vi IS NOT null
    -- vig_min_date: aucune VI globale ne pourra être avant cette date
    AND metric_date::date >= '{{ var('vig_min_date') }}'::date
),

-- La première VI pour chaque [indic,zone]
get_vig AS (
    SELECT
        indic_id,
        zone_id,
        metric_date AS vig_date,
        vi AS vig
    FROM vi_non_null_sorted
    WHERE r = 1
)

-- DELETED: si VI existe =>     on prend la 1e VI et set is_from_vi=TRUE
-- DELETED: sinon =>            on prend la 1e VA et set is_from_vi=FALSE
-- EN COURS: On prend toujours la VI de get_vig, et JAMAIS la 1e VA
SELECT
    true AS is_from_vi,
    coalesce(a.indic_id, null) AS indic_id,
    -- selection de la valeur
    coalesce(a.zone_id, null) AS zone_id,
    -- selection de la date - on prend TOUJOURS vig_date
    coalesce(a.vig, null) AS vig,
    -- is_from_vi: 
    --  + VRAI si la valeur est issue d'une VI, 
    --  + FAUX si elle est issue d'une VA
    CASE
        WHEN true THEN a.vig_date
        --else b.va_earliest_date
    END AS vig_date
FROM get_vig AS a
--full join get_va_early b
--on a.indic_id=b.indic_id and a.zone_id=b.zone_id
