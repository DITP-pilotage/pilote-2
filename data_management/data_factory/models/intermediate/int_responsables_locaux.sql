-- Responsables locaux avec des habilitations sur les chantiers
WITH resp_locaux_chantiers AS (
    SELECT 
        ARRAY_AGG(u.nom || ' ' || u.prenom) AS nom, 
        ARRAY_AGG(u.email) AS email, 
        UNNEST(h.territoires) AS territoire_code,
        UNNEST(h.chantiers) AS chantier_id
    FROM 
        public.habilitation h 
        LEFT JOIN public.utilisateur u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code IN ('RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
    GROUP BY 
        territoire_code,
        chantier_id
),
-- Directeurs de projets avec des habilitations sur les périmètres
resp_locaux_perimetres AS (
    SELECT 
        ARRAY_AGG(u.nom || ' ' || u.prenom) AS nom, 
        ARRAY_AGG(u.email) AS email, 
        UNNEST(h.territoires) AS territoire_code,
        UNNEST(h.perimetres) AS perimetre_id
    FROM 
        public.habilitation h 
        LEFT JOIN public.utilisateur u ON h.utilisateur_id = u.id 
    WHERE 
        u.profil_code IN ('RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT') 
        AND h.scope_code = 'lecture'
        AND h.perimetres <> '{}'
        AND h.territoires <> '{}'
    GROUP BY 
        territoire_code,
        perimetre_id    	
),
corresp_perimetres AS (
    SELECT 
        id AS chantier_id, 
        UNNEST(perimetre_ids) AS perimetre_id 
    FROM 
        {{ ref('stg_ppg_metadata__chantiers') }}
)

SELECT * FROM resp_locaux_chantiers 
WHERE chantier_id IS NOT NULL AND territoire_code IS NOT NULL
UNION ALL 
(
    SELECT 
        resp_locaux_perimetres.nom, 
        resp_locaux_perimetres.email,
        resp_locaux_perimetres.territoire_code,
        corresp_perimetres.chantier_id
    FROM 
        resp_locaux_perimetres 
        JOIN corresp_perimetres ON resp_locaux_perimetres.perimetre_id = corresp_perimetres.perimetre_id
    WHERE chantier_id IS NOT NULL AND territoire_code IS NOT NULL
)
