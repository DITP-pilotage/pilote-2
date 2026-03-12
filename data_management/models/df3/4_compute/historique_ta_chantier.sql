SELECT
    indicateurs.chantier_id,
    historique_ta_indic.snapshot_month,
    historique_ta_indic.zone_id,
    SUM(historique_ta_indic.ta_encadre * 0.01 * ponderation.poids_zone_reel) AS ta_chantier
FROM {{ ref('historique_ta_indic') }} AS historique_ta_indic
LEFT OUTER JOIN {{ ref('stg_ppg_metadata__indicateurs') }} indicateurs
    ON historique_ta_indic.indic_id = indicateurs.id
LEFT OUTER JOIN {{ ref('int_ponderation_reelle') }} ponderation
    ON
        historique_ta_indic.indic_id = ponderation.indic_id
        AND historique_ta_indic.zone_id = ponderation.zone_id
GROUP BY
    indicateurs.chantier_id,
    historique_ta_indic.snapshot_month,
    historique_ta_indic.zone_id
