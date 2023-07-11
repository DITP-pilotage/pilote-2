with

dfakto_chantier as (

    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.avancement_borne,
        dim_tree_nodes.code_chantier,
        dim_tree_nodes.zone_code as zone_id,
        dim_structures.nom as structure_nom
    FROM {{ ref('stg_dfakto__fact_progress_chantiers') }} fact_progress_chantier
        JOIN {{ ref('stg_dfakto__dim_tree_nodes') }} dim_tree_nodes ON fact_progress_chantier.tree_node_id = dim_tree_nodes.id
        JOIN {{ ref('stg_dfakto__dim_structures') }} dim_structures ON dim_tree_nodes.structure_id = dim_structures.id

),

chantier_est_barometre as (
    SELECT m_indicateurs.chantier_id,
        bool_or(m_indicateurs.est_barometre) as est_barometre
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} m_indicateurs
    GROUP BY m_indicateurs.chantier_id
)

SELECT m_chantiers.id,
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
        NULL AS meteo, -- todo a supprimer de la table prisma
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        chantier_est_barometre.est_barometre,
        m_chantiers.est_territorialise,
        CONCAT(m_chantiers.maille, '-', m_chantiers.code_insee) as territoire_code,
        CAST(NULL as double precision) as taux_avancement_precedent,
	    LOWER(m_chantiers.ate)::type_ate as ate
    FROM {{ ref('int_chantiers_with_mailles_and_territoires') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers
            ON m_chantiers.id = d_chantiers.code_chantier
                AND m_chantiers.zone_id = d_chantiers.zone_id
                AND d_chantiers.structure_nom IN ('Région', 'Département', 'Chantier')
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id
