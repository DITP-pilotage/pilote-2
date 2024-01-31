WITH ref_locaux AS (
    SELECT 
        ARRAY_AGG(INITCAP(u.prenom) || ' ' || INITCAP(u.nom)) AS nom, 
        ARRAY_AGG(u.email) AS email, 
        profil_code,
        UNNEST(h.territoires) AS territoire_code
    FROM 
        public.habilitation h 
        LEFT JOIN public.utilisateur u ON h.utilisateur_id = u.id 
    WHERE 
        (u.profil_code = 'REFERENT_REGION' OR u.profil_code = 'REFERENT_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
    GROUP BY territoire_code, u.profil_code
)

SELECT 
	nom,
	email,
	territoire_code 
FROM ref_locaux 
WHERE 
    (profil_code = 'REFERENT_REGION' AND territoire_code LIKE 'REG-%')
    OR 
    (profil_code = 'REFERENT_DEPARTEMENT' AND territoire_code LIKE 'DEPT-%')