WITH dir_projets_chantiers AS (
    SELECT
        utilisateur.id,
        utilisateur.email,
        UNNEST(habilitation.chantiers) AS chantier_id
    FROM
        "dev_pilote__6230"."public"."habilitation" AS habilitation
    LEFT JOIN
        "dev_pilote__6230"."public"."utilisateur" AS utilisateur
        ON habilitation.utilisateur_id = utilisateur.id
    WHERE
        utilisateur.profil_code = 'EQUIPE_DIR_PROJET'
        AND utilisateur.date_desactivation IS NULL
        AND habilitation.scope_code = 'responsabilite'
),

dir_projets_perimetres AS (
    SELECT
        UNNEST(habilitation.perimetres) AS perimetre_id,
        utilisateur.id,
        utilisateur.email
    FROM
        "dev_pilote__6230"."public"."habilitation" AS habilitation
    LEFT JOIN
        "dev_pilote__6230"."public"."utilisateur" AS utilisateur
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
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers"
),

dir_projets_complet AS (
    SELECT *
    FROM dir_projets_chantiers
    UNION ALL
    (
        SELECT
            dir_projets_perimetres.id,
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
    ARRAY_AGG(id::TEXT ORDER BY email) AS ids,
    chantier_id
FROM dir_projets_complet
GROUP BY chantier_id