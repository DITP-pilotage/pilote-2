SELECT
    indic.id AS indic_id,
    indic.chantier_id AS indic_parent_ch,
    NULL AS indic_nom,
    COALESCE(indic.nom_barometre, indic.nom) AS indic_nom_baro,
    NULL AS indic_descr,
    COALESCE(indic.description_barometre, indic.description)
        AS indic_descr_baro,
    CASE
        -- Si la tendance est ('HAUSSE', 'BAISSE') -> ('hausse', 'baisse')
        WHEN
            parametre_indic.tendance IN ('HAUSSE', 'BAISSE')
            THEN LOWER(parametre_indic.tendance)
        ELSE 'autre'
    END AS tendance,
    CASE
        WHEN
            parametre_indic.partitionne_vacg_par = 'from_previous_month'
            THEN 'glissant'
        WHEN
            parametre_indic.partitionne_vacg_par = 'from_year_start'
            AND parametre_indic.vacg_operation = 'sum'
            THEN 'cumul_annuel'
        WHEN
            parametre_indic.partitionne_vacg_par = 'from_year_start'
            THEN 'annuel'
        WHEN
            parametre_indic.partitionne_vacg_par = 'from_custom_date'
            AND parametre_indic.vacg_operation = 'sum'
            THEN 'cumul_non_annuel'
        ELSE 'random'
    END AS indic_categorie_evolution
FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS indic
LEFT JOIN
    {{ ref('stg_ppg_metadata__parametrage_indicateurs') }} AS parametre_indic
    ON indic.id = parametre_indic.indicateur_id
WHERE indic.est_barometre
