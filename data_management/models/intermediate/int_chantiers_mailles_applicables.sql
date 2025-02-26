SELECT
    meta_ch.id AS chantier_id,
    TRUE AS maille_est_applicable,
    UNNEST(m.maille_applicable) AS maille_applicable
FROM
    {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN
                meta_ch.est_territorialise
                THEN COALESCE(meta_ch.maille_applicable, '{NAT,DEPT,REG}')
            ELSE COALESCE(meta_ch.maille_applicable, '{NAT}')
        END AS maille_applicable
) AS m