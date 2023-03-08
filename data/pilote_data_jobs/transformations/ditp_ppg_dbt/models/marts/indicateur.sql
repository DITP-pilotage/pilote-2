WITH

historique_valeur_actuelle_indicateur as (

    SELECT *
    FROM {{ ref('stg_dfakto__fact_financials_enr') }}
    WHERE type_valeur = 'Valeur Actuelle'
      AND length(period_id::text) = 8
    ORDER BY tree_node_id, effect_id, period_id

),

historique_valeur_actuelle_transpose_par_indicateur_et_maille as (

    SELECT tree_node_id,
        effect_id,
        ARRAY_AGG(valeur) AS evolution_valeur_actuelle,
        ARRAY_AGG(dim_periods.date) AS evolution_date_valeur_actuelle
    FROM historique_valeur_actuelle_indicateur
    JOIN {{ ref('stg_dfakto__dim_periods') }} dim_periods ON historique_valeur_actuelle_indicateur.period_id = dim_periods.id
    GROUP BY tree_node_id, effect_id

),

dfakto_indicateur AS (

    SELECT fact_progress_indicateurs.tree_node_id,
        fact_progress_indicateurs.avancement_borne AS objectif_taux_avancement,
        fact_progress_indicateurs.valeur_cible AS objectif_valeur_cible,
        to_char(extract(year FROM fact_progress_indicateurs.date_valeur_cible), '9999') AS objectif_date_valeur_cible,
        fact_progress_indicateurs.date_valeur_actuelle,
        fact_progress_indicateurs.date_valeur_initiale,
        fact_progress_indicateurs.valeur_actuelle,
        fact_progress_indicateurs.valeur_initiale,
        dim_tree_nodes.zone_code,
        dim_structures.nom as nom_structure,
        fact_progress_indicateurs.effect_id,
        fact_progress_indicateurs.period_id,
        hist_va.evolution_valeur_actuelle,
        hist_va.evolution_date_valeur_actuelle
    FROM {{ ref('stg_dfakto__fact_progress_indicateurs') }} fact_progress_indicateurs
        JOIN {{ ref('stg_dfakto__dim_tree_nodes') }} dim_tree_nodes ON fact_progress_indicateurs.tree_node_id = dim_tree_nodes.id
        JOIN {{ ref('stg_dfakto__dim_structures') }} dim_structures ON dim_tree_nodes.structure_id = dim_structures.id
        LEFT JOIN historique_valeur_actuelle_transpose_par_indicateur_et_maille hist_va
            ON hist_va.tree_node_id = dim_tree_nodes.id
            AND hist_va.effect_id = fact_progress_indicateurs.effect_id

)
(SELECT DISTINCT ON (effect_id, nom_structure, m_zones.code_insee)
    m_indicateurs.id,
    m_indicateurs.nom,
    m_indicateurs.chantier_id,
    d_indicateurs.objectif_valeur_cible,
    d_indicateurs.objectif_taux_avancement,
    d_indicateurs.objectif_date_valeur_cible,
    m_indicateurs.indicateur_type_id as type_id,
    indicateur_types.nom AS type_nom,
    m_indicateurs.est_barometre,
    m_indicateurs.est_phare,
    d_indicateurs.date_valeur_actuelle,
    d_indicateurs.date_valeur_initiale,
    d_indicateurs.valeur_actuelle,
    d_indicateurs.valeur_initiale,
    m_zones.code_insee,
    CASE
        WHEN d_indicateurs.nom_structure = 'Réforme'
            THEN 'NAT'
        WHEN d_indicateurs.nom_structure = 'Département'
            THEN 'DEPT'
        WHEN d_indicateurs.nom_structure = 'Région'
            THEN 'REG'
    END maille,
    m_zones.nom AS territoire_nom,
    d_indicateurs.evolution_valeur_actuelle,
    d_indicateurs.evolution_date_valeur_actuelle,
    m_indicateurs.description,
    m_indicateurs.source,
    m_indicateurs.mode_de_calcul
FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
    JOIN dfakto_indicateur d_indicateurs ON m_indicateurs.nom = d_indicateurs.effect_id AND d_indicateurs.nom_structure IN ('Département', 'Région', 'Réforme')
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} indicateur_types ON indicateur_types.id = m_indicateurs.indicateur_type_id
    JOIN {{ ref('stg_ppg_metadata__zones') }} m_zones ON m_zones.id = d_indicateurs.zone_code
ORDER BY effect_id, nom_structure, m_zones.code_insee, period_id DESC)
