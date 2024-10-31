-- responsables locaux avec des habilitations sur les chantiers
WITH resp_locaux AS (
    SELECT 
        INITCAP(u.prenom) || ' ' || INITCAP(u.nom) AS nom, 
        u.email AS email,
        u.profil_code,
        t.territoire_code,
        c.chantier_id
    FROM 
        {{ source('db_schema_public', 'habilitation') }} h 
        JOIN {{ source('db_schema_public', 'utilisateur') }} u ON h.utilisateur_id = u.id AND h.scope_code = 'responsabilite'
        LEFT JOIN UNNEST(h.territoires) AS t(territoire_code) ON true
        LEFT JOIN UNNEST(h.chantiers) AS c(chantier_id) ON true
    WHERE 
        u.profil_code in ('SERVICES_DECONCENTRES_REGION', 'PREFET_REGION', 'COORDINATEUR_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'PREFET_DEPARTEMENT', 'COORDINATEUR_DEPARTEMENT')
)
SELECT 
	ARRAY_AGG(a.nom) as nom,
	ARRAY_AGG(email) as email,
    chantier_id,
	a.territoire_code,
    t.zone_id
FROM resp_locaux a
LEFT JOIN {{ source('db_schema_public', 'territoire') }} t ON a.territoire_code=t.code
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} z ON t.zone_id=z.id
WHERE 
    (profil_code in ('SERVICES_DECONCENTRES_REGION', 'PREFET_REGION', 'COORDINATEUR_REGION') AND z.maille='REG')
    OR 
    (profil_code in ('SERVICES_DECONCENTRES_DEPARTEMENT', 'PREFET_DEPARTEMENT', 'COORDINATEUR_DEPARTEMENT') AND z.maille='DEPT')
GROUP BY chantier_id, territoire_code, zone_id
