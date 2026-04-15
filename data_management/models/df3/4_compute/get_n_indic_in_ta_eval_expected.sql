SELECT
    chantier_id,
    zone_id,
    COUNT(zone_id) AS n_indic_in_ta_expected
FROM {{ ref('int_ponderation_reelle') }}
WHERE
    poids_eval_zone_reel > 0
GROUP BY
    chantier_id,
    zone_id
ORDER BY chantier_id, zone_id
