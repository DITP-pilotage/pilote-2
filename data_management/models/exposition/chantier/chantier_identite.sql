{{ config(
        materialized = 'incremental', 
        unique_key = ['id'],
        incremental_strategy='merge'
    )
}}

WITH

-- On récupère les directeurs des directions porteuses de chaque chantier
ch_unnest_porteurs_dac AS (
    SELECT
        mc.id AS chantier_id,
        UNNEST(mc.directeurs_administration_centrale_ids) AS pi
    FROM {{ ref('stg_ppg_metadata__chantiers') }} AS mc
),

ch_unnest_porteurs_dac_pnames AS (
    SELECT
        a.*,
        mp.directeur,
        -- Affichage de '-' si pas d'acronyme de porteur
        COALESCE(mp.acronyme, '-') AS acronyme
    FROM ch_unnest_porteurs_dac AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__porteurs') }} AS mp ON a.pi = mp.id
),

ch_unnest_porteurs_dac_pnames_agg AS (
    SELECT
        chantier_id,
        ARRAY_AGG(pi) AS p_id,
        ARRAY_AGG(directeur) AS p_directeurs,
        ARRAY_AGG(acronyme) AS p_acronymes
    FROM ch_unnest_porteurs_dac_pnames
    GROUP BY chantier_id
),

chantier_est_barometre AS (
    SELECT
        m_indicateurs.chantier_id,
        BOOL_OR(m_indicateurs.est_barometre) AS est_barometre
    FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS m_indicateurs
    GROUP BY m_indicateurs.chantier_id
),

-- Indique pour chaque chantier s'il existe un TA à chaque maille
ch_maille_has_ta_pivot_clean AS (
    SELECT
        a.chantier_id,
        BOOL_OR(a.tag_ch IS NOT NULL) FILTER (
            WHERE z.zone_type = 'DEPT'
        ) AS has_ta_dept,
        BOOL_OR(a.tag_ch IS NOT NULL) FILTER (
            WHERE z.zone_type = 'REG'
        ) AS has_ta_reg,
        BOOL_OR(a.tag_ch IS NOT NULL) FILTER (
            WHERE z.zone_type = 'NAT'
        ) AS has_ta_nat
    FROM {{ ref('compute_ta_ch') }} AS a
    LEFT JOIN
        {{ source('db_schema_public', 'territoire') }} AS t
        ON a.territoire_code = t.code
    LEFT JOIN
        {{ source('python_load', 'metadata_zones') }} AS z
        ON t.zone_id = z.zone_id
    GROUP BY a.chantier_id
),

-- Table des synthèses triée par date
synthese_triee_par_date AS (
    SELECT
        chantier_id,
        code_insee,
        maille,
        meteo,
        date_meteo,
        ROW_NUMBER()
            OVER (
                PARTITION BY chantier_id, code_insee, maille
                ORDER BY date_meteo DESC
            )
        AS row_id_by_date_meteo_desc
    FROM {{ source('db_schema_public', 'synthese_des_resultats') }}
),

-- Indique pour chaque chantier s'il existe une météo à chaque maille
ch_has_meteo AS (
    SELECT
        chantier_id,
        BOOL_OR(meteo IS NOT NULL) FILTER (
            WHERE maille = 'DEPT'
        ) AS has_meteo_dept,
        BOOL_OR(meteo IS NOT NULL) FILTER (
            WHERE maille = 'REG'
        ) AS has_meteo_reg,
        BOOL_OR(meteo IS NOT NULL) FILTER (
            WHERE maille = 'NAT'
        ) AS has_meteo_nat
    FROM synthese_triee_par_date
    GROUP BY chantier_id
)


SELECT
    meta_ch.id,
    meta_ch.nom,
    meta_ch.perimetre_ids,
    COALESCE(
        p_names.p_directeurs, STRING_TO_ARRAY('', '')
    ) AS directeurs_administration_centrale,
    COALESCE(
        p_names.p_acronymes, STRING_TO_ARRAY('', '')
    ) AS directions_administration_centrale,
    meta_ch.ministeres_ids AS ministeres,
    meta_ch.ministeres_polygrammes AS ministeres_acronymes,
    dir_projets.nom AS directeurs_projet,
    ax.axe_name AS axe,
    ppg.ppg_nom AS ppg,
    dir_projets.email AS directeurs_projet_mails,
    chantier_est_barometre.est_barometre,
    meta_ch.est_territorialise,
    LOWER(meta_ch.ate)::type_ate AS ate,
    has_ta.has_ta_dept AS possede_taux_avancement_departemental,
    has_ta.has_ta_reg AS possede_taux_avancement_regional,
    ch_has_meteo.has_meteo_dept AS possede_meteo_departemental,
    ch_has_meteo.has_meteo_reg AS possede_meteo_regional,
    -- Si ch_cible_attendue=NULL -> on le considère TRUE
    COALESCE(meta_ch.statut::type_statut, 'PUBLIE') AS statut,
    COALESCE(meta_ch.ch_cible_attendue, TRUE) AS cible_attendue,
    ARRAY(
        SELECT LOWER(maille)::maille
        FROM UNNEST(
            CASE 
                WHEN meta_ch.est_territorialise THEN COALESCE(meta_ch.maille_applicable_declaree, ARRAY['NAT', 'REG', 'DEPT'])
                ELSE ARRAY['NAT']
            END
        ) AS maille
    ) AS mailles_applicables,
    FALSE AS a_supprimer

FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
LEFT JOIN
    ch_unnest_porteurs_dac_pnames_agg AS p_names
    ON meta_ch.id = p_names.chantier_id
LEFT JOIN
    {{ ref('int_directeurs_projets') }} AS dir_projets
    ON meta_ch.id = dir_projets.chantier_id
LEFT JOIN
    {{ source('python_load', 'metadata_ppgs') }} AS ppg
    ON meta_ch.ppg_id = ppg.ppg_id
LEFT JOIN
    {{ source('python_load', 'metadata_axes') }} AS ax
    ON ppg.ppg_axe = ax.axe_id
LEFT JOIN
    chantier_est_barometre
    ON meta_ch.id = chantier_est_barometre.chantier_id
LEFT JOIN
    ch_maille_has_ta_pivot_clean AS has_ta
    ON meta_ch.id = has_ta.chantier_id
LEFT JOIN ch_has_meteo ON meta_ch.id = ch_has_meteo.chantier_id
ORDER BY meta_ch.id
