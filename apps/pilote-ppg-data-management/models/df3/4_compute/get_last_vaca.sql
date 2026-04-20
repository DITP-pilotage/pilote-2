-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VACA
WITH
sort_mesures_vaca AS (
    SELECT
        *,
        RANK()
            OVER (PARTITION BY indic_id, zone_id ORDER BY metric_date DESC)
            AS r
    FROM {{ ref('compute_ta_indic') }}
    WHERE vaca IS NOT NULL
),

sort_mesures_vaca_last AS (
    SELECT * FROM sort_mesures_vaca
    WHERE r = 1
)

SELECT
    indic_id,
    zone_id,
    metric_date AS date_valeur_actuelle,
    vaca,
    tag,
    taa_courant,
    vacp,
    tap_global,
    tap_courant,
    date_valeur_proposition
FROM sort_mesures_vaca_last
