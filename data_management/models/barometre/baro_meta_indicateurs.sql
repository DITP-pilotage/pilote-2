SELECT
    mi.id AS indic_id,
    mi.chantier_id AS indic_parent_ch,
    NULL AS indic_nom,
    COALESCE(mi.nom_barometre, mi.nom) AS indic_nom_baro,
    NULL AS indic_descr,
    COALESCE(mi.description_barometre, mi.description) AS indic_descr_baro,
    CASE
        -- Si la tendance est ('HAUSSE', 'BAISSE') -> ('hausse', 'baisse')
        WHEN mpi.tendance IN ('HAUSSE', 'BAISSE') THEN LOWER(mpi.tendance)
        ELSE 'autre'
    END AS tendance,
    CASE
        WHEN mpi.partitionne_vacg_par = 'from_previous_month' THEN 'glissant'
        WHEN
            mpi.partitionne_vacg_par = 'from_year_start'
            AND mpi.vacg_operation = 'sum'
            THEN 'cumul_annuel'
        WHEN mpi.partitionne_vacg_par = 'from_year_start' THEN 'annuel'
        WHEN
            mpi.partitionne_vacg_par = 'from_custom_date'
            AND mpi.vacg_operation = 'sum'
            THEN 'cumul_non_annuel'
        ELSE 'random'
    END AS indic_categorie_evolution
FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS mi
LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs') }} AS mpi
    ON mi.id = mpi.indicateur_id
WHERE est_barometre
ORDER BY mi.id
