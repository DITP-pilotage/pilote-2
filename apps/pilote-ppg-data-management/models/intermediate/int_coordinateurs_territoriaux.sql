WITH coord_locaux AS (
    SELECT
        ARRAY_AGG(utilisateur.id::TEXT ORDER BY utilisateur.email) AS ids,
        utilisateur.profil_code,
        UNNEST(habilitation.territoires) AS territoire_code
    FROM
        {{ source('db_schema_public', 'habilitation') }} AS habilitation
    LEFT JOIN
        {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
        ON habilitation.utilisateur_id = utilisateur.id
    WHERE
        (
            utilisateur.profil_code = 'COORDINATEUR_REGION'
            OR utilisateur.profil_code = 'COORDINATEUR_DEPARTEMENT'
        )
        AND utilisateur.date_desactivation IS NULL
        AND habilitation.scope_code = 'lecture'
    GROUP BY territoire_code, utilisateur.profil_code
)

SELECT
    coord_locaux.ids,
    coord_locaux.territoire_code,
    territoire.zone_id
FROM coord_locaux
LEFT JOIN
    {{ source('db_schema_public', 'territoire') }} AS territoire
    ON coord_locaux.territoire_code = territoire.code
LEFT JOIN
    {{ ref('stg_ppg_metadata__zones') }} AS zones
    ON territoire.zone_id = zones.id
WHERE
    (coord_locaux.profil_code = 'COORDINATEUR_REGION' AND zones.maille = 'REG')
    OR
    (
        coord_locaux.profil_code = 'COORDINATEUR_DEPARTEMENT'
        AND zones.maille = 'DEPT'
    )
