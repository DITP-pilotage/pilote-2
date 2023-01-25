TRUNCATE TABLE public.indicateur;

WITH
    fact_financials_enr_ordered as
        (
            select *
            from raw_data.fact_financials_enr
            where state_id = 'Valeur Actuelle'
              and length(period_id) = 8
            order by tree_node_id, effect_id, period_id
        ),
    historique_indicateur as (
        SELECT tree_node_id,
               effect_id,
               ARRAY_AGG(financials_decumulated_amount) AS evolution_valeur_actuelle,
               ARRAY_AGG(period_id)                     AS evolution_date_valeur_actuelle
        FROM fact_financials_enr_ordered
        GROUP BY tree_node_id, effect_id
    ),
    dfakto_indicateur AS (
    SELECT fact_progress_indicateur.tree_node_id,
        fact_progress_indicateur.bounded_progress AS objectif_taux_avancement,
        fact_progress_indicateur.valeur_cible AS objectif_valeur_cible,
        to_char(extract(year FROM date_valeur_cible), '9999') AS objectif_date_valeur_cible,
        fact_progress_indicateur.date_valeur_actuelle,
        fact_progress_indicateur.date_valeur_initiale,
        fact_progress_indicateur.valeur_actuelle,
        fact_progress_indicateur.valeur_initiale,
        split_part(dim_tree_nodes.tree_node_code, '-', 2) AS code_region,
        raw_data.dim_structures.structure_name,
        raw_data.fact_progress_indicateur.effect_id,
        raw_data.fact_progress_indicateur.period_id,
        historique_indicateur.evolution_valeur_actuelle,
        historique_indicateur.evolution_date_valeur_actuelle
    FROM raw_data.fact_progress_indicateur
        JOIN raw_data.dim_tree_nodes ON fact_progress_indicateur.tree_node_id = dim_tree_nodes.tree_node_id
        JOIN raw_data.dim_structures ON dim_tree_nodes.structure_id = dim_structures.structure_id
        LEFT JOIN historique_indicateur ON historique_indicateur.tree_node_id = dim_tree_nodes.tree_node_id AND
                                      historique_indicateur.effect_id = fact_progress_indicateur.effect_id
    )
INSERT INTO public.indicateur
    ((SELECT DISTINCT ON (effect_id)
         indic_id AS id,
         indic_nom AS nom,
         indic_parent_ch AS chantier_id,
         objectif_valeur_cible,
         objectif_taux_avancement,
         objectif_date_valeur_cible,
         indic_type AS type_id,
         indic_type_name AS type_nom,
         indic_is_baro AS est_barometre,
         indic_is_phare AS est_phare,
         date_valeur_actuelle,
         date_valeur_initiale,
         valeur_actuelle,
         valeur_initiale,
         m_zone.zone_code AS code_insee,
         m_zone.zone_type AS maille,
         m_zone.nom AS territoire_nom
    FROM raw_data.metadata_indicateur m_indicateur
         JOIN dfakto_indicateur d_indicateur ON m_indicateur.indic_nom = d_indicateur.effect_id AND d_indicateur.structure_name = 'Réforme'
         LEFT JOIN raw_data.indicateur_type ON indicateur_type.indic_type_id = m_indicateur.indic_type
         JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = 'FRANCE'
    ORDER BY effect_id, period_id DESC)
    UNION
    (SELECT DISTINCT ON (effect_id, structure_name, m_zone.zone_code)
        indic_id AS id,
        indic_nom AS nom,
        indic_parent_ch AS chantier_id,
        objectif_valeur_cible,
        objectif_taux_avancement,
        objectif_date_valeur_cible,
        indic_type AS type_id,
        indic_type_name AS type_nom,
        indic_is_baro AS est_barometre,
        indic_is_phare AS est_phare,
        date_valeur_actuelle,
        date_valeur_initiale,
        valeur_actuelle,
        valeur_initiale,
        m_zone.zone_code AS code_insee,
        CASE
            WHEN d_indicateur.structure_name = 'Département'
                THEN 'DEPT'
            WHEN d_indicateur.structure_name = 'Région'
                THEN 'REG'
        END maille,
        m_zone.nom AS territoire_nom
    FROM raw_data.metadata_indicateur m_indicateur
        JOIN dfakto_indicateur d_indicateur ON m_indicateur.indic_nom = d_indicateur.effect_id AND d_indicateur.structure_name IN ('Département', 'Région')
        LEFT JOIN raw_data.indicateur_type ON indicateur_type.indic_type_id = m_indicateur.indic_type
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = d_indicateur.code_region
    ORDER BY effect_id, structure_name, m_zone.zone_code , period_id DESC));
