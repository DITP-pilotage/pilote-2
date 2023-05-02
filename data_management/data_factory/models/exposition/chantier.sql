with

dfakto_chantier as (

    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.avancement_borne,
        dim_tree_nodes.code_chantier,
        dim_tree_nodes.zone_code,
        dim_structures.nom as structure_nom,
        view_data_properties.meteo_nom
    FROM {{ ref('stg_dfakto__fact_progress_chantiers') }} fact_progress_chantier
        JOIN {{ ref('stg_dfakto__dim_tree_nodes') }} dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.id
        JOIN {{ ref('stg_dfakto__dim_structures') }} dim_structures ON dim_tree_nodes.structure_id = dim_structures.id
        -- TODO: suppression de la prochaine jointure car météo rentré dans l'application
        LEFT JOIN {{ ref('stg_dfakto__view_data_properties') }} view_data_properties ON view_data_properties.reforme_code = dim_tree_nodes.code

),

chantier_est_barometre as (
    SELECT m_indicateurs.chantier_id,
        bool_or(m_indicateurs.est_barometre) as est_barometre
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
    GROUP BY m_indicateurs.chantier_id
)

(SELECT m_chantiers.id,
        m_chantiers.nom,
        m_chantiers.code_insee,
        d_chantiers.avancement_borne AS taux_avancement,
        m_chantiers.nom AS territoire_nom,
        m_chantiers.perimetre_ids,
        m_chantiers.maille,
        m_chantiers.directeurs_administration_centrale,
        m_chantiers.ministeres,
        m_chantiers.directions_administration_centrale,
        m_chantiers.directeurs_projet,
        COALESCE(chantier_meteos.id, 'NON_RENSEIGNEE') AS meteo,
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        chantier_est_barometre.est_barometre,
        m_chantiers.est_territorialise,
        'NAT-FR' as territoire_code
    FROM {{ ref('int_chantiers_with_mailles_and_territoires') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers ON m_chantiers.id_chantier_perseverant = d_chantiers.code_chantier AND d_chantiers.structure_nom='Réforme'
        LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ANY(m_chantiers.directeurs_administration_centrale_ids)
        LEFT JOIN {{ ref('stg_ppg_metadata__chantier_meteos') }} chantier_meteos ON chantier_meteos.nom_dfakto = d_chantiers.meteo_nom
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id
    WHERE m_chantiers.maille = 'NAT')
UNION
    (SELECT m_chantiers.id,
        m_chantiers.nom,
        m_chantiers.code_insee,
        d_chantiers.avancement_borne AS taux_avancement,
        m_chantiers.nom AS territoire_nom,
        m_chantiers.perimetre_ids,
        m_chantiers.maille,
        m_chantiers.directeurs_administration_centrale,
        m_chantiers.ministeres,
        m_chantiers.directions_administration_centrale,
        m_chantiers.directeurs_projet,
        'NON_NECESSAIRE' AS meteo,
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        chantier_est_barometre.est_barometre,
        m_chantiers.est_territorialise,
        'NAT-FR' as territoire_code
    FROM {{ ref('int_chantiers_with_mailles_and_territoires') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers ON m_chantiers.id_chantier_perseverant = d_chantiers.code_chantier AND d_chantiers.structure_nom IN ('Région', 'Département')
        LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} m_porteurs ON m_porteurs.id = ANY(m_chantiers.directeurs_administration_centrale_ids)
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id
    WHERE m_chantiers.est_territorialise = True AND m_chantiers.maille IN ('DEPT', 'REG'))
