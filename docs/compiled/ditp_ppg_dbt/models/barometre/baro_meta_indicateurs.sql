SELECT 
    mi.id as indic_id,
    mi.chantier_id as indic_parent_ch,
    NULL AS indic_nom, 
    COALESCE(mi.nom_barometre, mi.nom) AS indic_nom_baro, 
    NULL AS indic_descr, 
    COALESCE(mi.description_barometre, mi.description) AS indic_descr_baro,
    CASE
        -- Si la tendance est ('HAUSSE', 'BAISSE') -> ('hausse', 'baisse')
        WHEN mpi.tendance IN ('HAUSSE', 'BAISSE') THEN lower(mpi.tendance)
        ELSE 'autre'
    END as tendance,
    CASE 
        WHEN mpi.partitionne_vacg_par='from_previous_month' THEN 'glissant' 
        WHEN mpi.partitionne_vacg_par = 'from_year_start' AND mpi.vacg_operation = 'sum' THEN 'cumul_annuel'
        WHEN mpi.partitionne_vacg_par = 'from_year_start' THEN 'annuel'
        WHEN mpi.partitionne_vacg_par='from_custom_date' AND mpi.vacg_operation = 'sum' THEN 'cumul_non_annuel'
        ELSE 'random'
    END AS indic_categorie_evolution
FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" mi
LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__parametrage_indicateurs" mpi 
    ON mpi.indicateur_id = mi.id
WHERE est_barometre
ORDER BY mi.id