TRUNCATE TABLE public.chantier;

WITH dfakto_chantier AS (
    SELECT fact_progress_chantier.tree_node_id,
           fact_progress_chantier.bounded_progress,
           split_part(dim_tree_nodes.tree_node_code, '-', 1) AS code_chantier,
           split_part(dim_tree_nodes.tree_node_code, '-', 2) AS code_region,
           dim_structures.structure_name,
           view_data_properties.meteo,
           view_data_properties.objectifs_de_la_reforme,
           view_data_properties.objectifs_de_la_reforme_date_de_mise_a_jour
    FROM raw_data.fact_progress_chantier
             JOIN raw_data.dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.tree_node_id
             JOIN raw_data.dim_structures ON dim_tree_nodes.structure_id = dim_structures.structure_id
             LEFT JOIN raw_data.view_data_properties on view_data_properties.reforme_code = dim_tree_nodes.tree_node_code
),
dfakto_chantier_objectifs AS (
    SELECT code_region as code_chantier, -- car maille nationale inversée entre code chantier et region
        objectifs_de_la_reforme,
        objectifs_de_la_reforme_date_de_mise_a_jour
    FROM dfakto_chantier
    WHERE code_chantier = 'OVQ'
)
INSERT INTO public.chantier
    (SELECT m_chantier.chantier_id AS id,
            m_chantier.ch_nom AS nom,
            m_zone.zone_code AS code_insee,
            d_chantier.bounded_progress AS taux_avancement,
            m_zone.nom AS territoire_nom,
            string_to_array(m_chantier.ch_per, ' | ') AS perimetre_ids,
            m_zone.zone_type AS maille,
            array(SELECT m_porteur.porteur_directeur
                  FROM   unnest(string_to_array(m_chantier."porteur_ids_DAC", ' | ')) WITH ORDINALITY a(id, i)
                             JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
                  ORDER  BY a.i
                ) AS directeurs_administration_centrale,
            array(SELECT m_porteur.porteur_name_short
                  FROM   unnest(string_to_array(m_chantier."porteur_ids_noDAC", ' | ')) WITH ORDINALITY a(id, i)
                             JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
                  ORDER  BY a.i
                ) AS ministeres,
            array(SELECT m_porteur.porteur_name_short
                  FROM   unnest(string_to_array(m_chantier."porteur_ids_DAC", ' | ')) WITH ORDINALITY a(id, i)
                             JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
                  ORDER  BY a.i
                ) AS directions_administration_centrale,
            string_to_array(m_chantier.ch_dp, ' | ') AS directeurs_projet,
            COALESCE(chantier_meteo.ch_meteo_id, 'NON_RENSEIGNEE') AS meteo,
            m_axe.axe_name AS axe,
            m_ppg.ppg_nom AS ppg,
            string_to_array(m_chantier.ch_dp_mail, ' | ') AS directeurs_projet_mails,
            d_chantier.objectifs_de_la_reforme as objectifs,
            d_chantier.objectifs_de_la_reforme_date_de_mise_a_jour as date_objectifs
     FROM raw_data.metadata_chantier m_chantier
              LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_region AND d_chantier.structure_name='Réforme'
              JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = 'FRANCE'
              LEFT JOIN raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = ANY (string_to_array(m_chantier."porteur_ids_DAC", ' | '))
              LEFT JOIN raw_data.chantier_meteo ON chantier_meteo.ch_meteo_name_dfakto = d_chantier.meteo
              LEFT JOIN raw_data.metadata_ppg m_ppg ON m_ppg.ppg_id = m_chantier.ch_ppg
              LEFT JOIN raw_data.metadata_axe m_axe ON m_axe.axe_id = m_ppg.ppg_axe)
UNION
(SELECT m_chantier.chantier_id AS id,
        m_chantier.ch_nom AS nom,
        m_zone.zone_code AS code_insee,
        d_chantier.bounded_progress AS taux_avancement,
        m_zone.nom AS territoire_nom,
        string_to_array(m_chantier.ch_per, ' | ') AS perimetre_ids,
        m_zone.zone_type AS maille,
        array(SELECT m_porteur.porteur_directeur
              FROM   unnest(string_to_array(m_chantier."porteur_ids_DAC", ' | ')) WITH ORDINALITY a(id, i)
                         JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
              ORDER  BY a.i
            ) AS directeurs_administration_centrale,
        array(SELECT m_porteur.porteur_name_short
              FROM   unnest(string_to_array(m_chantier."porteur_ids_noDAC", ' | ')) WITH ORDINALITY a(id, i)
                         JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
              ORDER  BY a.i
            ) AS ministeres,
        array(SELECT m_porteur.porteur_name_short
              FROM   unnest(string_to_array(m_chantier."porteur_ids_DAC", ' | ')) WITH ORDINALITY a(id, i)
                         JOIN   raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = id
              ORDER  BY a.i
            ) AS directions_administration_centrale,
        string_to_array(m_chantier.ch_dp, ' | ') AS directeurs_projet,
        'NON_NECESSAIRE' AS meteo,
        m_axe.axe_name AS axe,
        m_ppg.ppg_nom AS ppg,
        string_to_array(m_chantier.ch_dp_mail, ' | ') AS directeurs_projet_mails,
        dfakto_chantier_objectifs.objectifs_de_la_reforme as objectifs,
        dfakto_chantier_objectifs.objectifs_de_la_reforme_date_de_mise_a_jour as date_objectifs
    FROM raw_data.metadata_chantier m_chantier
        LEFT JOIN dfakto_chantier d_chantier ON m_chantier.ch_perseverant = d_chantier.code_chantier AND d_chantier.structure_name IN ('Région', 'Département')
        JOIN raw_data.metadata_zone m_zone ON m_zone.zone_id = d_chantier.code_region
        LEFT JOIN raw_data.metadata_porteur m_porteur ON m_porteur.porteur_id = ANY (string_to_array(m_chantier."porteur_ids_DAC", ' | '))
        LEFT JOIN raw_data.metadata_ppg m_ppg ON m_ppg.ppg_id = m_chantier.ch_ppg
        LEFT JOIN raw_data.metadata_axe m_axe ON m_axe.axe_id = m_ppg.ppg_axe
        LEFT JOIN dfakto_chantier_objectifs ON m_chantier.ch_perseverant = dfakto_chantier_objectifs.code_chantier);

