{{ config(materialized='table') }}

WITH
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

-- Indique la date de météo la plus récente
synthese_triee_par_date_last1 AS (
    SELECT * FROM synthese_triee_par_date WHERE row_id_by_date_meteo_desc = 1
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
    LEFT JOIN {{ ref('metadata_zones') }} AS z ON t.zone_id = z.zone_id
    GROUP BY a.chantier_id
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
),

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
        mp.porteur_directeur,
        mp.porteur_short
    FROM ch_unnest_porteurs_dac AS a
    LEFT JOIN {{ ref('metadata_porteurs') }} AS mp ON a.pi = mp.porteur_id
),

ch_unnest_porteurs_dac_pnames_agg AS (
    SELECT
        chantier_id,
        ARRAY_AGG(pi) AS p_id,
        ARRAY_AGG(porteur_directeur) AS p_directeurs,
        ARRAY_AGG(porteur_short) AS p_shorts
    FROM ch_unnest_porteurs_dac_pnames
    GROUP BY chantier_id
),

mailles_applicables AS (
    SELECT
        mc.id AS chantier_id,
        TRUE AS maille_est_applicable,
        UNNEST(m.maille_applicable) AS maille_applicable
    FROM
        {{ ref('stg_ppg_metadata__chantiers') }} AS mc
    CROSS JOIN LATERAL (
        SELECT
            CASE
                WHEN
                    mc.est_territorialise
                    THEN COALESCE(mc.maille_applicable, '{NAT,DEPT,REG}')
                ELSE COALESCE(mc.maille_applicable, '{NAT}')
            END AS maille_applicable
    ) AS m
)


SELECT
    mc.id,
    mc.nom,
    t.code_insee,
    ta_ch_today.tag_ch AS taux_avancement,
    ta_ch_today.date_ta::date AS taux_avancement_date,
    ta_ch_today.taa_courant_ch AS taux_avancement_annuel,
    ta_ch_prev_month.tag_ch AS taux_avancement_precedent,
    t.nom AS territoire_nom,
    mc.perimetre_ids,
    z.zone_type AS "maille",
    -- coalesce with empty array
    mc.ministeres_ids AS ministeres,
    mc.ministeres_polygrammes AS ministeres_acronymes,
    dir_projets.nom AS directeurs_projet,
    -- coalesce with empty array
    resp_locaux.nom AS responsables_locaux,
    coord_territoriaux.nom AS coordinateurs_territoriaux,
    sr.meteo,
    ax.axe_name AS axe,
    dir_projets.email AS directeurs_projet_mails,
    resp_locaux.email AS responsables_locaux_mails,
    coord_territoriaux.email AS coordinateurs_territoriaux_mails,
    chantier_est_barometre.est_barometre,
    mc.est_territorialise,
    -- Si ch_cible_attendue=NULL -> on le considère TRUE
    COALESCE(mc.ch_cible_attendue, TRUE) as cible_attendue,
    t.code AS territoire_code,
    LOWER(mc.ate)::type_ate AS ate,
    has_ta.has_ta_dept AS a_taux_avancement_departemental,
    has_ta.has_ta_reg AS a_taux_avancement_regional,
    ch_has_meteo.has_meteo_dept AS a_meteo_departemental,
    ch_has_meteo.has_meteo_reg AS a_meteo_regional,
    FALSE AS a_supprimer,
    COALESCE(
        p_names.p_directeurs, STRING_TO_ARRAY('', '')
    ) AS directeurs_administration_centrale,
    COALESCE(
        p_names.p_shorts, STRING_TO_ARRAY('', '')
    ) AS directions_administration_centrale,
    COALESCE(mc.statut::type_statut, 'PUBLIE') AS statut,
    COALESCE(chantier_za.zone_est_applicable, TRUE)
    AND COALESCE(
        mailles_applicables.maille_est_applicable, FALSE
    ) AS est_applicable,
    CASE
        -- values replicated REG->DEPT
        WHEN
            UPPER(mc.replicate_val_reg_to) = 'DEPT' AND z.zone_type = 'DEPT'
            THEN 'reg'::maille
        -- values replicated NAT->DEPT
        WHEN
            UPPER(mc.replicate_val_nat_to) = 'DEPT' AND z.zone_type = 'DEPT'
            THEN 'nat'::maille
        -- values replicated NAT->REG
        WHEN
            UPPER(mc.replicate_val_nat_to) = 'REG' AND z.zone_type = 'REG'
            THEN 'reg'::maille
    END AS donnees_maille_source
FROM {{ ref('stg_ppg_metadata__chantiers') }} AS mc
-- On dupplique les lignes chantier pour chaque territoire
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS t
LEFT JOIN
    {{ ref('int_directeurs_projets') }} AS dir_projets
    ON mc.id = dir_projets.chantier_id
LEFT JOIN
    {{ ref('int_responsables_locaux') }} AS resp_locaux
    ON mc.id = resp_locaux.chantier_id AND t.code = resp_locaux.territoire_code
LEFT JOIN
    {{ ref('int_coordinateurs_territoriaux') }} AS coord_territoriaux
    ON t.code = coord_territoriaux.territoire_code
LEFT JOIN {{ ref('metadata_zones') }} AS z ON t.zone_id = z.zone_id
--LEFT JOIN {{ ref('metadata_porteurs') }} AS po 
--  ON mc."porteur_ids_DAC" = po.porteur_id
LEFT JOIN
    ch_unnest_porteurs_dac_pnames_agg AS p_names
    ON mc.id = p_names.chantier_id
LEFT JOIN synthese_triee_par_date_last1 AS sr
    ON
        mc.id = sr.chantier_id
        AND z.zone_type = sr.maille
        AND t.code_insee = sr.code_insee
LEFT JOIN {{ ref('metadata_axes') }} AS ax ON mc.axe_id = ax.axe_id 
LEFT JOIN chantier_est_barometre ON mc.id = chantier_est_barometre.chantier_id
LEFT JOIN ch_maille_has_ta_pivot_clean AS has_ta ON mc.id = has_ta.chantier_id
LEFT JOIN ch_has_meteo ON mc.id = ch_has_meteo.chantier_id
LEFT JOIN
    (
        SELECT * FROM {{ ref('compute_ta_ch') }} WHERE valid_on = 'today'
    ) AS ta_ch_today
    ON mc.id = ta_ch_today.chantier_id AND z.zone_id = ta_ch_today.zone_id
LEFT JOIN
    (
        SELECT * FROM {{ ref('compute_ta_ch') }} WHERE valid_on = 'prev_month'
    ) AS ta_ch_prev_month
    ON
        mc.id = ta_ch_prev_month.chantier_id
        AND z.zone_id = ta_ch_prev_month.zone_id
LEFT JOIN
    mailles_applicables
    ON
        mc.id = mailles_applicables.chantier_id
        AND z.zone_type = mailles_applicables.maille_applicable
LEFT JOIN
    {{ ref('int_chantiers_zone_applicables') }} AS chantier_za
    ON mc.id = chantier_za.chantier_id AND z.zone_id = chantier_za.zone_id
ORDER BY mc.id, t.zone_id
