SELECT 
    id,
    maille,
    CASE 
        WHEN maille_la_plus_fine = 'DEPT' AND maille IN ('NAT', 'REG', 'DEPT') THEN TRUE
        WHEN maille_la_plus_fine = 'REG'  AND maille IN ('NAT', 'REG')         THEN TRUE
        WHEN maille_la_plus_fine = 'NAT'  AND maille = 'NAT'                   THEN TRUE
        ELSE FALSE
    END AS maille_est_applicable
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs"
CROSS JOIN (
    SELECT unnest(array['NAT', 'REG', 'DEPT']) AS maille
) AS mailles_possibles