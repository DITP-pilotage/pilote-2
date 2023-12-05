{{config(materialized = 'table')}}

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
),

chantier_taux_avancement_departemental as (
    SELECT d_chantier.code_chantier,
            count(*) > 0 as a_taux_avancement_departemental
    FROM dfakto_chantier d_chantier
        LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} ppg_zones ON d_chantier.zone_id = ppg_zones.id
    WHERE avancement_borne is not NULL
    AND ppg_zones.maille = 'DEPT'
    GROUP BY d_chantier.code_chantier
),

chantier_taux_avancement_regional as (
    SELECT d_chantier.code_chantier,
            count(*) > 0 as a_taux_avancement_regional
    FROM dfakto_chantier d_chantier
        LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} ppg_zones ON d_chantier.zone_id = ppg_zones.id
    WHERE avancement_borne is not NULL
    AND ppg_zones.maille = 'REG'
    GROUP BY d_chantier.code_chantier
),

chantier_meteo_departemental as (
    SELECT chantier_id,
            count(*) > 0 as a_meteo_departemental
    FROM synthese_triee_par_date
    WHERE meteo is not NULL
    AND maille = 'DEPT'
    GROUP BY chantier_id
),

chantier_meteo_regional as (
    SELECT chantier_id,
            count(*) > 0 as a_meteo_regional
    FROM synthese_triee_par_date
    WHERE meteo is not NULL
    AND maille = 'REG'
    GROUP BY chantier_id
),

indicateurs_zones AS (
	SELECT DISTINCT
        spmi.id as indic_id,
        chantier_id, 
        zones.id as zone_id 
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} spmi
	CROSS JOIN (
        SELECT DISTINCT
            id
        FROM {{ ref('stg_ppg_metadata__zones') }}
        ) as zones 
),
indicateurs_zones_applicables AS (
	SELECT DISTINCT
        iz.indic_id,
        iz.chantier_id,
        iz.zone_id,
        COALESCE(iiza.est_applicable, TRUE) AS est_applicable 
    FROM indicateurs_zones iz
	LEFT JOIN {{ ref('int_indicateurs_zones_applicables') }} iiza 
    ON iz.indic_id = iiza.indic_id AND iz.zone_id = iiza.zone_id
),
chantiers_zones_applicables AS (
    SELECT 
        chantier_id,
        zone_id,
        bool_or(est_applicable) as est_applicable
    FROM indicateurs_zones_applicables 
    GROUP BY chantier_id, zone_id
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
	    LOWER(m_chantiers.ate)::type_ate as ate,
        chantier_ta_dep.a_taux_avancement_departemental,
        chantier_ta_reg.a_taux_avancement_regional,
        chantier_meteo_dep.a_meteo_departemental,
        chantier_meteo_reg.a_meteo_regional,
        chantier_za.est_applicable,
        false AS a_supprimer
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
        LEFT JOIN chantier_taux_avancement_departemental chantier_ta_dep ON m_chantiers.id = chantier_ta_dep.code_chantier
        LEFT JOIN chantier_taux_avancement_regional chantier_ta_reg ON m_chantiers.id = chantier_ta_reg.code_chantier
        LEFT JOIN chantier_meteo_departemental chantier_meteo_dep ON m_chantiers.id = chantier_meteo_dep.chantier_id
        LEFT JOIN chantier_meteo_regional chantier_meteo_reg ON m_chantiers.id = chantier_meteo_reg.chantier_id
        LEFT JOIN chantiers_zones_applicables chantier_za ON chantier_za.chantier_id = m_chantiers.id AND chantier_za.zone_id = m_chantiers.zone_id
    WHERE synthese_triee_par_date.row_id_by_date_meteo_desc = 1
        OR synthese_triee_par_date.row_id_by_date_meteo_desc IS NULL
