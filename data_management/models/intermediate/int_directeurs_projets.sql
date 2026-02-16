WITH dir_projets_chantiers AS (
    SELECT
        INITCAP(utilisateur.prenom) || ' ' || INITCAP(utilisateur.nom) AS nom,
        utilisateur.email,
        UNNEST(habilitation.chantiers) AS chantier_id
    FROM
        {{ source('db_schema_public', 'habilitation') }} AS habilitation
    LEFT JOIN
        {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
        ON habilitation.utilisateur_id = utilisateur.id
    WHERE
        utilisateur.profil_code = 'EQUIPE_DIR_PROJET'
        AND utilisateur.date_desactivation IS NULL
        AND habilitation.scope_code = 'responsabilite'
),

dir_projets_perimetres AS (
    SELECT
        UNNEST(habilitation.perimetres) AS perimetre_id,
        INITCAP(utilisateur.prenom) || ' ' || INITCAP(utilisateur.nom) AS nom,
        utilisateur.email
    FROM
        {{ source('db_schema_public', 'habilitation') }} AS habilitation
    LEFT JOIN
        {{ source('db_schema_public', 'utilisateur') }} AS utilisateur
        ON habilitation.utilisateur_id = utilisateur.id
    WHERE
        utilisateur.profil_code = 'EQUIPE_DIR_PROJET'
        AND utilisateur.date_desactivation IS NULL
        AND habilitation.scope_code = 'responsabilite'
),

corresp_perimetres AS (
    SELECT
        id AS chantier_id,
        UNNEST(perimetre_ids) AS perimetre_id
    FROM
        {{ ref('stg_ppg_metadata__chantiers') }}
),

dir_projets_complet AS (
    SELECT *
    FROM dir_projets_chantiers
    UNION ALL
    (
        SELECT
            dir_projets_perimetres.nom,
            dir_projets_perimetres.email,
            corresp_perimetres.chantier_id
        FROM
            dir_projets_perimetres
        INNER JOIN
            corresp_perimetres
            ON
                dir_projets_perimetres.perimetre_id
                = corresp_perimetres.perimetre_id
    )
)

SELECT
    ARRAY_AGG(nom ORDER BY email) AS nom,
    -- On trie par email pour éviter les différences de tri
    -- et que les noms soient associés aux bons emails
    -- (email est PK d'utilisateurs dc pas de doublons)
    ARRAY_AGG(email ORDER BY email) AS email,
    chantier_id
FROM dir_projets_complet
GROUP BY chantier_id
