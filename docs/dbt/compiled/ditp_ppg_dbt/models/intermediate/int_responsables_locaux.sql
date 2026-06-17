-- responsables locaux avec des habilitations sur les chantiers
WITH resp_locaux AS (
    SELECT
        utilisateur.id,
        utilisateur.email,
        utilisateur.profil_code,
        territoires.territoire_code,
        chantiers.chantier_id
    FROM
        "dev_pilote__6230"."public"."habilitation" AS habilitation
    INNER JOIN
        "dev_pilote__6230"."public"."utilisateur" AS utilisateur
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
    ARRAY_AGG(resp_locaux.id::TEXT ORDER BY resp_locaux.email) AS ids,
    resp_locaux.chantier_id,
    resp_locaux.territoire_code,
    territoire.zone_id
FROM resp_locaux
LEFT JOIN
    "dev_pilote__6230"."public"."territoire" AS territoire
    ON resp_locaux.territoire_code = territoire.code
LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
    ON territoire.zone_id = zones.id
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