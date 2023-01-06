TRUNCATE TABLE public.chantier;

WITH dfakto_chantier AS (
    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.bounded_progress,
        split_part(dim_tree_nodes.tree_node_code, '-', 1) as code_chantier,
        split_part(dim_tree_nodes.tree_node_code, '-', 2) as code_region,
        raw_data.dim_structures.structure_name
    FROM raw_data.fact_progress_chantier
        JOIN raw_data.dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.tree_node_id
        JOIN raw_data.dim_structures ON dim_tree_nodes.structure_id = dim_structures.structure_id
    )
INSERT INTO public.chantier
    ((SELECT m_chantier.chantier_id as id,
        m_chantier.ch_nom as nom,
        m_chantier.ch_per as id_perimetre,
        m_zone.zone_code as code_insee,
        d_chantier.bounded_progress as taux_avancement,
        m_zone.nom as territoire_nom,
        string_to_array(m_chantier.ch_per, ' | ') as perimetre_ids,
        m_zone.zone_type as maille
    FROM raw_data.metadata_chantier m_chantier
        LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_region and d_chantier.structure_name='Réforme'
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = 'FRANCE')
UNION
    (SELECT m_chantier.chantier_id as id,
        m_chantier.ch_nom as nom,
        m_chantier.ch_per as id_perimetre,
        m_zone.zone_code as code_insee,
        d_chantier.bounded_progress as taux_avancement,
        m_zone.nom as territoire_nom,
        string_to_array(m_chantier.ch_per, ' | ') as perimetre_ids,
        m_zone.zone_type as maille
    FROM raw_data.metadata_chantier m_chantier
        LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_chantier and d_chantier.structure_name IN ('Région', 'Département')
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = d_chantier.code_region));