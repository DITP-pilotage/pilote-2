SELECT 
    mi.indic_id,
    mi.indic_parent_ch,
    NULL AS indic_nom, 
    COALESCE(mi.indic_nom_baro, mi.indic_nom) AS indic_nom_baro, 
    NULL AS indic_descr, 
    COALESCE(mi.indic_descr_baro, mi.indic_descr) AS indic_descr_baro,
    CASE
        -- Si la tendance est ('HAUSSE', 'BAISSE') -> ('hausse', 'baisse')
        WHEN mpi.tendance IN ('HAUSSE', 'BAISSE') THEN lower(mpi.tendance)
        ELSE 'autre'
    END as tendance,
    CASE 
        WHEN mpi.param_vacg_partition_date LIKE 'from_previous_month%' THEN 'glissant' 
        WHEN mpi.param_vacg_partition_date = 'from_year_start' AND mpi.param_vacg_op = 'sum' THEN 'cumul_annuel'
        WHEN mpi.param_vacg_partition_date = 'from_year_start' THEN 'annuel'
        WHEN mpi.param_vacg_partition_date LIKE 'from_custom_date%' AND mpi.param_vacg_op = 'sum' THEN 'cumul_non_annuel'
        ELSE 'random'
    END AS indic_categorie_evolution
FROM {{ ref('metadata_indicateurs') }} mi
LEFT JOIN {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} mpi 
    ON mpi.indic_id = mi.indic_id
WHERE indic_is_baro
ORDER BY indic_id
