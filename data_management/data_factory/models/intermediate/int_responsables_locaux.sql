-- responsables locaux avec des habilitations sur les chantiers
WITH resp_locaux_chantiers AS (
    SELECT 
        INITCAP(u.prenom) || ' ' || INITCAP(u.nom) AS nom, 
        u.email AS email,
        u.profil_code,
        UNNEST(h.territoires) AS territoire_code,
        UNNEST(h.chantiers) AS chantier_id
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code in ('RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
),

-- Directeurs de projets avec des habilitations sur les périmètres
resp_locaux_perimetres AS (
    SELECT 
        INITCAP(u.prenom) || ' ' || INITCAP(u.nom) AS nom, 
        u.email AS email, 
        u.profil_code,
        UNNEST(h.territoires) AS territoire_code,
        UNNEST(h.perimetres) AS perimetre_id
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code IN ('RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
        and h.perimetres <> '{}'
        and h.territoires <> '{}'	
),

corresp_perimetres AS (
    SELECT 
        id AS chantier_id, 
        UNNEST(perimetre_ids) AS perimetre_id 
    FROM 
        {{ ref('stg_ppg_metadata__chantiers') }}
),

resp_locaux_complet as (
	SELECT * FROM resp_locaux_chantiers 
	WHERE chantier_id IS NOT NULL AND territoire_code IS NOT NULL
	UNION ALL 
	(
	    SELECT 
	        resp_locaux_perimetres.nom, 
	        resp_locaux_perimetres.email,
	        resp_locaux_perimetres.profil_code,
	        resp_locaux_perimetres.territoire_code,
	        corresp_perimetres.chantier_id
	    FROM 
	        resp_locaux_perimetres 
	        JOIN corresp_perimetres ON resp_locaux_perimetres.perimetre_id = corresp_perimetres.perimetre_id
	    where chantier_id IS NOT NULL AND territoire_code IS NOT NULL
	)
)

SELECT 
	ARRAY_AGG(a.nom) as nom,
	ARRAY_AGG(email) as email,
    chantier_id,
	a.territoire_code,
    t.zone_id
FROM resp_locaux_complet a
LEFT JOIN {{ source('db_schema_public', 'territoire') }} t ON a.territoire_code=t.code
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} z ON t.zone_id=z.id
WHERE 
    (profil_code = 'RESPONSABLE_REGION' AND z.maille='REG')
    OR 
    (profil_code = 'RESPONSABLE_DEPARTEMENT' AND z.maille='DEPT')
GROUP BY chantier_id, territoire_code, zone_id
