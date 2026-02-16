-- responsables locaux avec des habilitations sur les chantiers
WITH resp_locaux AS (
    SELECT
        INITCAP(utilisateur.prenom) || ' ' || INITCAP(utilisateur.nom) AS nom,
        utilisateur.email,
        utilisateur.profil_code,
        territoires.territoire_code,
        chantiers.chantier_id
    FROM
        {{ source('db_schema_public', 'habilitation') }} AS habilitation
    INNER JOIN
        {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
        ON
            habilitation.utilisateur_id = utilisateur.id
            AND habilitation.scope_code = 'responsabilite'
    LEFT JOIN
        UNNEST(habilitation.territoires) AS territoires (territoire_code)
        ON TRUE
    LEFT JOIN UNNEST(habilitation.chantiers) AS chantiers (chantier_id) ON TRUE
    WHERE
        utilisateur.profil_code IN (
            'SERVICES_DECONCENTRES_REGION',
            'PREFET_REGION',
            'COORDINATEUR_REGION',
            'SERVICES_DECONCENTRES_DEPARTEMENT',
            'PREFET_DEPARTEMENT',
            'COORDINATEUR_DEPARTEMENT'
        )
        AND utilisateur.date_desactivation IS NULL
)

SELECT
    -- On trie par email pour éviter les différences de tri
    -- et que les noms soient associés aux bons emails
    -- (email est PK d'utilisateurs dc pas de doublons)
    ARRAY_AGG(resp_locaux.nom ORDER BY resp_locaux.email) AS nom,
    ARRAY_AGG(resp_locaux.email ORDER BY resp_locaux.email) AS email,
    resp_locaux.chantier_id,
    resp_locaux.territoire_code,
    territoire.zone_id
FROM resp_locaux
LEFT JOIN
    {{ source('db_schema_public', 'territoire') }} AS territoire
    ON resp_locaux.territoire_code = territoire.code
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS zones
    ON zones.id = territoire.zone_id
WHERE
    (
        resp_locaux.profil_code IN (
            'SERVICES_DECONCENTRES_REGION',
            'PREFET_REGION',
            'COORDINATEUR_REGION'
        )
        AND zones.maille = 'REG'
    )
    OR
    (
        resp_locaux.profil_code IN (
            'SERVICES_DECONCENTRES_DEPARTEMENT',
            'PREFET_DEPARTEMENT',
            'COORDINATEUR_DEPARTEMENT'
        )
        AND zones.maille = 'DEPT'
    )
GROUP BY
    resp_locaux.chantier_id, resp_locaux.territoire_code, territoire.zone_id
