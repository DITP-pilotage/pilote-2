WITH dir_projets_chantiers AS (
    SELECT 
        INITCAP(u.prenom) || ' ' || INITCAP(u.nom) AS nom, 
        u.email AS email, 
        UNNEST(h.chantiers) AS chantier_id
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code = 'DIR_PROJET' 
        AND h.scope_code = 'lecture'
),

dir_projets_perimetres AS (
    SELECT 
        UNNEST(h.perimetres) AS perimetre_id,
        INITCAP(u.prenom) || ' ' || INITCAP(u.nom) AS nom, 
        u.email AS email
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code = 'DIR_PROJET' 
        AND h.scope_code = 'lecture'
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
            JOIN corresp_perimetres ON dir_projets_perimetres.perimetre_id = corresp_perimetres.perimetre_id
    )
)

SELECT 		
    array_agg(nom) AS nom,
    array_agg(email) AS email,
    chantier_id
FROM dir_projets_complet
GROUP BY chantier_id
