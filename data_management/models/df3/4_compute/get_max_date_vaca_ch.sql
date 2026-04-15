-- cf doc dbt

WITH
indic_taa_courant_dispo AS (
    SELECT
        b.chantier_id,
        indic_id,
        zone_id,
        metric_date,
        taa_courant
    FROM {{ ref('compute_ta_indic') }} AS a
    LEFT JOIN
        {{ ref('stg_ppg_metadata__indicateurs') }} AS b
        ON a.indic_id = b.id
    WHERE vaca IS NOT NULL
),

ch_count_taa_courant_par_date AS (
    SELECT
        chantier_id,
        zone_id,
        metric_date,
        COUNT(indic_id) AS n_taa_dispos
    FROM indic_taa_courant_dispo
    GROUP BY chantier_id, zone_id, metric_date
--order by chantier_id, zone_id, metric_date desc
),

rank_dates_taa_ch_dispo AS (
    SELECT
        *,
        RANK()
            OVER (PARTITION BY chantier_id, zone_id ORDER BY metric_date DESC)
            AS r
    FROM ch_count_taa_courant_par_date
)

SELECT
    chantier_id,
    zone_id,
    -- on prend la date où r==1
    MAX(metric_date) FILTER (WHERE r = 1) AS max_date_taa_courant_today,
    -- on prend la date où r==2
    MAX(metric_date) FILTER (WHERE r = 2) AS max_date_taa_courant_previous
FROM rank_dates_taa_ch_dispo
GROUP BY chantier_id, zone_id
