WITH mailles_possibles AS (
    SELECT UNNEST(ARRAY['NAT', 'REG', 'DEPT']) AS maille
)
SELECT
    indicateurs.id,
    mailles_possibles.maille,
    CASE
        WHEN
            indicateurs.maille_la_plus_fine = 'DEPT'
            AND mailles_possibles.maille IN ('NAT', 'REG', 'DEPT')
            THEN TRUE
        WHEN
            indicateurs.maille_la_plus_fine = 'REG'
            AND mailles_possibles.maille IN ('NAT', 'REG')
            THEN TRUE
        WHEN
            indicateurs.maille_la_plus_fine = 'NAT'
            AND mailles_possibles.maille = 'NAT'
            THEN TRUE
        ELSE FALSE
    END AS maille_est_applicable
FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS indicateurs
CROSS JOIN mailles_possibles
