TRUNCATE TABLE public.chantier;

WITH dfakto_chantier AS (
    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.bounded_progress,
        split_part(dim_tree_nodes.tree_node_code, '-', 1) AS code_chantier,
        split_part(dim_tree_nodes.tree_node_code, '-', 2) AS code_region,
        raw_data.dim_structures.structure_name
    FROM raw_data.fact_progress_chantier
        JOIN raw_data.dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.tree_node_id
        JOIN raw_data.dim_structures ON dim_tree_nodes.structure_id = dim_structures.structure_id
    )
INSERT INTO public.chantier
    (SELECT m_chantier.chantier_id AS id,
        m_chantier.ch_nom AS nom,
        m_chantier.ch_per AS id_perimetre,
        m_zone.zone_code AS code_insee,
        d_chantier.bounded_progress AS taux_avancement,
        m_zone.nom AS zone_nom,
        string_to_array(m_chantier.ch_per, ' | ') AS perimetre_ids,
        m_zone.zone_type AS maille,
        m_chantier.ch_dp AS directeur_projet,
        string_to_array(m_chantier."porteur_ids_DAC", ' | ') AS directeurs_administration_centrale,
        array(SELECT m_porteur.porteur_name
     		FROM   unnest(string_to_array(m_chantier."porteur_ids_noDAC", ' | ')) WITH ORDINALITY a(id, i)
     		JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
     		ORDER  BY a.i
     	)  AS ministeres
    FROM raw_data.metadata_chantier m_chantier
        LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_region AND d_chantier.structure_name='Réforme'
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = 'FRANCE'
        LEFT JOIN raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = any (string_to_array(m_chantier."porteur_ids_DAC", ' | ')))
UNION
    (SELECT m_chantier.chantier_id AS id,
        m_chantier.ch_nom AS nom,
        m_chantier.ch_per AS id_perimetre,
        m_zone.zone_code AS code_insee,
        d_chantier.bounded_progress AS taux_avancement,
        m_zone.nom AS zone_nom,
        string_to_array(m_chantier.ch_per, ' | ') AS perimetre_ids,
        m_zone.zone_type AS maille,
        m_chantier.ch_dp AS directeur_projet,
        string_to_array(m_chantier."porteur_ids_DAC", ' | ') AS directeurs_administration_centrale,
        array(SELECT m_porteur.porteur_name
     		FROM   unnest(string_to_array(m_chantier."porteur_ids_noDAC", ' | ')) WITH ORDINALITY a(id, i)
     		JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
     		ORDER  BY a.i
     	)  AS ministeres
    FROM raw_data.metadata_chantier m_chantier
        LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_chantier AND d_chantier.structure_name IN ('Région', 'Département')
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = d_chantier.code_region
        LEFT JOIN raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = any (string_to_array(m_chantier."porteur_ids_DAC", ' | ')));