WITH ref_locaux AS (
    SELECT 
        ARRAY_AGG(INITCAP(u.prenom) || ' ' || INITCAP(u.nom)) AS nom, 
        ARRAY_AGG(u.email) AS email, 
        profil_code,
        UNNEST(h.territoires) AS territoire_code
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        LEFT JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id 
    WHERE 
        (u.profil_code = 'REFERENT_REGION' OR u.profil_code = 'REFERENT_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
    GROUP BY territoire_code, u.profil_code
)

SELECT 
	a.nom,
	email,
	territoire_code,
    t.zone_id
FROM ref_locaux a
left join {{ source('db_schema_public', 'territoire') }} t on a.territoire_code=t.code
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} z ON t.zone_id=z.id
WHERE 
    (profil_code = 'REFERENT_REGION' AND z.maille='REG')
    OR 
    (profil_code = 'REFERENT_DEPARTEMENT' AND z.maille='DEPT')
