with

dfakto_chantier as (

    SELECT fact_progress_chantier.tree_node_id,
        fact_progress_chantier.avancement_borne,
        fact_progress_chantier.avancement_precedent,
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
),

synthese_triee_par_date as (
    SELECT ROW_NUMBER() OVER (PARTITION BY chantier_id, code_insee, maille ORDER BY date_meteo DESC) AS row_id_by_date_meteo_desc,
        chantier_id,
        code_insee,
        maille,
        meteo,
        date_meteo
    FROM {{ ref('synthese_des_resultats') }}
)


SELECT m_chantiers.id,
        m_chantiers.nom,
        m_chantiers.code_insee,
        d_chantiers.avancement_borne AS taux_avancement,
        d_chantiers.avancement_precedent AS taux_avancement_precedent,
        m_chantiers.nom AS territoire_nom,
        m_chantiers.perimetre_ids,
        m_chantiers.maille,
        m_chantiers.directeurs_administration_centrale,
        m_chantiers.ministeres,
        m_chantiers.directions_administration_centrale,
        m_chantiers.directeurs_projet,
        synthese_triee_par_date.meteo AS meteo,
        m_axes.nom AS axe,
        m_ppgs.nom AS ppg,
        m_chantiers.directeurs_projet_mails,
        chantier_est_barometre.est_barometre,
        m_chantiers.est_territorialise,
        CONCAT(m_chantiers.maille, '-', m_chantiers.code_insee) as territoire_code,
	    LOWER(m_chantiers.ate)::type_ate as ate
    FROM {{ ref('int_chantiers_with_mailles_and_territoires') }} m_chantiers
        LEFT JOIN dfakto_chantier d_chantiers
            ON m_chantiers.id = d_chantiers.code_chantier
                AND m_chantiers.zone_id = d_chantiers.zone_id
                AND d_chantiers.structure_nom IN ('Région', 'Département', 'Chantier')
        LEFT JOIN {{ ref('stg_ppg_metadata__ppgs') }} m_ppgs ON m_ppgs.id = m_chantiers.ppg_id
        LEFT JOIN {{ ref('stg_ppg_metadata__axes') }} m_axes ON m_axes.id = m_ppgs.axe_id
        LEFT JOIN chantier_est_barometre on m_chantiers.id = chantier_est_barometre.chantier_id
        LEFT JOIN synthese_triee_par_date
            ON synthese_triee_par_date.chantier_id = m_chantiers.id
                AND synthese_triee_par_date.maille = m_chantiers.maille
                AND synthese_triee_par_date.code_insee = m_chantiers.code_insee
    WHERE synthese_triee_par_date.row_id_by_date_meteo_desc = 1
        OR synthese_triee_par_date.row_id_by_date_meteo_desc IS NULL
