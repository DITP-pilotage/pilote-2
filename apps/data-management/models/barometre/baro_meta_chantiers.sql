WITH chantiers_baro AS (
-- ID des chantiers dans le baromètre
    SELECT
        indic_parent_ch AS chantier_id,
        COUNT(*) AS n
    FROM {{ ref('baro_meta_indicateurs') }}
    GROUP BY indic_parent_ch
)

-- On ajoute le nom et l'engagement correspondant pour chaque chantier
SELECT
    chantiers_baro.chantier_id,
    chantiers.nom AS ch_nom,
    chantiers.nom_engagement AS engagement_short
FROM chantiers_baro
LEFT JOIN {{ ref('stg_ppg_metadata__chantiers') }} AS chantiers
    ON chantiers_baro.chantier_id = chantiers.id
