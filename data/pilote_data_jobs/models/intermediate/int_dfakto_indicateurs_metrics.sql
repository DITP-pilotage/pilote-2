WITH

historique_valeur_actuelle_indicateur AS (

    SELECT fact_fin.tree_node_id,
        fact_fin.period_id,
        fact_fin.effect_id,
        fact_fin.valeur,
        dim_periods.date
    FROM {{ ref('stg_dfakto__fact_financials') }} AS fact_fin
    JOIN {{ ref('stg_dfakto__dim_periods') }} dim_periods ON fact_fin.period_id = dim_periods.id
    WHERE type_valeur = 'Valeur réalisée'
        AND length(period_id::text) = 8
    ORDER BY tree_node_id, effect_id, period_id

),

historique_valeur_actuelle_transpose_par_indicateur_et_maille AS (

    SELECT tree_node_id,
        effect_id,
        ARRAY_AGG(valeur) AS evolution_valeur_actuelle,
        ARRAY_AGG(date) AS evolution_date_valeur_actuelle,
        ARRAY_AGG(period_id) as test
    FROM historique_valeur_actuelle_indicateur
    GROUP BY tree_node_id, effect_id

)

SELECT fact_progress_indicateurs.tree_node_id,
    fact_progress_indicateurs.avancement_borne AS objectif_taux_avancement,
    fact_progress_indicateurs.valeur_cible_globale AS objectif_valeur_cible,
    to_char(extract(year FROM fact_progress_indicateurs.date_valeur_cible_globale), '9999') AS objectif_date_valeur_cible,
    fact_progress_indicateurs.date_valeur_actuelle,
    fact_progress_indicateurs.date_valeur_initiale,
    fact_progress_indicateurs.valeur_actuelle,
    fact_progress_indicateurs.valeur_initiale,
    dim_tree_nodes.zone_code,
    dim_structures.nom as nom_structure,
    fact_progress_indicateurs.effect_id,
    hist_va.evolution_valeur_actuelle,
    hist_va.evolution_date_valeur_actuelle
FROM {{ ref('stg_dfakto__fact_progress_indicateurs') }} fact_progress_indicateurs
    JOIN {{ ref('stg_dfakto__dim_tree_nodes') }} dim_tree_nodes ON fact_progress_indicateurs.tree_node_id = dim_tree_nodes.id
    JOIN {{ ref('stg_dfakto__dim_structures') }} dim_structures ON dim_tree_nodes.structure_id = dim_structures.id
    LEFT JOIN historique_valeur_actuelle_transpose_par_indicateur_et_maille hist_va
        ON hist_va.tree_node_id = dim_tree_nodes.id
        AND hist_va.effect_id = fact_progress_indicateurs.effect_id
