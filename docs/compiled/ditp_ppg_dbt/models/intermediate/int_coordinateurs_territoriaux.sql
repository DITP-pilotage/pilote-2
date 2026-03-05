WITH coord_locaux AS (
    SELECT
    -- On trie par email pour éviter les différences de tri
    -- et que les noms soient associés aux bons emails
    -- (email est PK d'utilisateurs dc pas de doublons)
        ARRAY_AGG(
            INITCAP(utilisateur.prenom)
            || ' '
            || INITCAP(utilisateur.nom)
            ORDER BY utilisateur.email
        )
            AS nom,
        ARRAY_AGG(utilisateur.email ORDER BY utilisateur.email) AS email,
        utilisateur.profil_code,
        UNNEST(habilitation.territoires) AS territoire_code
    FROM
        "dev_pilote__6230"."public"."habilitation" AS habilitation
    LEFT JOIN
        "dev_pilote__6230"."public"."utilisateur" AS utilisateur
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
    coord_locaux.nom,
    coord_locaux.email,
    coord_locaux.territoire_code,
    territoire.zone_id
FROM coord_locaux
LEFT JOIN
    "dev_pilote__6230"."public"."territoire" AS territoire
    ON coord_locaux.territoire_code = territoire.code
LEFT JOIN
    "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
    ON territoire.zone_id = zones.id
WHERE
    (coord_locaux.profil_code = 'COORDINATEUR_REGION' AND zones.maille = 'REG')
    OR
    (
        coord_locaux.profil_code = 'COORDINATEUR_DEPARTEMENT'
        AND zones.maille = 'DEPT'
    )