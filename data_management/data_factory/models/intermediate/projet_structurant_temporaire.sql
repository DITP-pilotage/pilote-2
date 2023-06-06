SELECT
    DISTINCT ON (data_financials_ps.projet_structurant_code)
    {{ dbt_utils.surrogate_key(['data_financials_ps.projet_structurant_code']) }} as id,
    data_financials_ps.projet_structurant_code as code,
    data_financials_ps.projet_structurant_nom as nom,
    fact_progress_ps.avancement as taux_avancement,
    data_financials_ps.taux_avancement_date_de_mise_a_jour as date_taux_avancement,
    territoire.code as territoire_code,
    ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = data_financials_ps.perimetre_ministeriel_1
        AND data_financials_ps.perimetre_ministeriel_1 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = data_financials_ps.perimetre_ministeriel_2
        AND data_financials_ps.perimetre_ministeriel_2 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = data_financials_ps.perimetre_ministeriel_3
        AND data_financials_ps.perimetre_ministeriel_3 IS NOT NULL
    ) || ARRAY(
        SELECT perimetre_projet_structurant.perimetres_ppg_id
        FROM {{ ref('perimetre_projet_structurant')}} perimetre_projet_structurant
        WHERE perimetre_projet_structurant.perimetre_ps_nom = data_financials_ps.perimetre_ministeriel_4
        AND data_financials_ps.perimetre_ministeriel_4 IS NOT NULL
    ) as perimetres_ids,
    CASE 
        WHEN data_financials_ps.direction_de_l_administration_porteuse_du_projet IS NULL THEN ARRAY[]::varchar[]
        ELSE ARRAY[direction_de_l_administration_porteuse_du_projet]
    END as direction_administration,
    CASE 
        WHEN data_financials_ps.chefferie_de_projet IS NULL THEN ARRAY[]::varchar[]
        ELSE ARRAY[chefferie_de_projet]
    END as chefferie_de_projet,
    CASE 
        WHEN data_financials_ps.co_porteur_du_projet IS NULL THEN ARRAY[]::varchar[]
        ELSE ARRAY[co_porteur_du_projet]
    END as co_porteurs
    FROM {{ ref('stg_dfakto__ps_view_data_financials') }} data_financials_ps
        JOIN territoire ON data_financials_ps.zone_code = territoire.zone_id
        JOIN {{ ref('stg_dfakto__ps_dim_tree_nodes') }} dim_tree_nodes_ps ON data_financials_ps.projet_structurant_code = dim_tree_nodes_ps.code
        LEFT JOIN {{ ref('stg_dfakto__fact_progress_project') }} fact_progress_ps ON dim_tree_nodes_ps.id = fact_progress_ps.tree_node_id
    ORDER BY data_financials_ps.projet_structurant_code
