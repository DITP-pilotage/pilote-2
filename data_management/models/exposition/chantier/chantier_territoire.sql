-- depends_on: {{ ref('chantier_identite') }}

{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code'])
}}

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

mailles_applicables AS (
    SELECT
        meta_ch.id AS chantier_id,
        TRUE AS maille_est_applicable,
        UNNEST(m.maille_applicable) AS maille_applicable
    FROM
        {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
    CROSS JOIN LATERAL (
        SELECT
            CASE
                WHEN
                    meta_ch.est_territorialise
                    THEN COALESCE(meta_ch.maille_applicable, '{NAT,DEPT,REG}')
                ELSE COALESCE(meta_ch.maille_applicable, '{NAT}')
            END AS maille_applicable
    ) AS m
),

mediane_par_chantier AS (
    SELECT
        chantier_id,
        z.zone_type AS maille,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY tag_ch) AS mediane
    FROM
        {{ ref('compute_ta_ch') }} AS ta_ch_today
    LEFT JOIN
        {{ source('python_load', 'metadata_zones') }} AS z
        ON ta_ch_today.zone_id = z.zone_id
    WHERE
        valid_on = 'today' AND tag_ch IS NOT NULL AND z.zone_type <> 'NAT'
    GROUP BY
        chantier_id, z.zone_type
)

SELECT
    meta_ch.id,
    t.code AS territoire_code,
    t.code_insee,
    t.maille AS maille,
    z.zone_id,
    CASE
        WHEN date_bascule.date_depassee
            THEN ta_ch_today.tag_ch
        ELSE ta_prev_year.tag_prev_year
    END AS taux_avancement_mandat,
    CASE
        WHEN date_bascule.date_depassee
            THEN ta_ch_today.date_ta::date
        ELSE ta_prev_year.taa_prev_year_date::date
    END AS date_taux_avancement_mandat,
    t.nom AS territoire_nom,
    sr.meteo,
    ta_ch_prev_month.tag_ch AS taux_avancement_mandat_valeur_precedente,
    COALESCE(chantier_za.zone_est_applicable, TRUE)
    AND COALESCE(
        mailles_applicables.maille_est_applicable, FALSE
    ) AS est_applicable,
    resp_locaux.nom AS responsables_locaux,
    coord_territoriaux.nom AS coordinateurs_territoriaux,
    resp_locaux.email AS responsables_locaux_mails,
    coord_territoriaux.email AS coordinateurs_territoriaux_mails,
    sr.date_meteo::date AS derniere_maj_date_qualitative,
    CASE
        WHEN
            ta_ch_today.tag_ch IS NULL
            THEN NULL::type_tendance
        WHEN
            ta_ch_prev_month.tag_ch IS NULL
            OR ta_ch_today.tag_ch = ta_ch_prev_month.tag_ch
            THEN 'STAGNATION'::type_tendance
        WHEN
            ta_ch_today.tag_ch > ta_ch_prev_month.tag_ch
            THEN 'HAUSSE'::type_tendance
        WHEN
            ta_ch_today.tag_ch < ta_ch_prev_month.tag_ch
            THEN 'BAISSE'::type_tendance
    END AS tendance,
    CASE
        WHEN
            ta_ch_today.tag_ch IS NULL
            THEN NULL
        WHEN
            ta_ch_prev_month.tag_ch IS NULL
            OR ta_ch_today.tag_ch = ta_ch_prev_month.tag_ch
            THEN 0
        WHEN
            ta_ch_today.tag_ch > ta_ch_prev_month.tag_ch
            THEN 1
        WHEN
            ta_ch_today.tag_ch < ta_ch_prev_month.tag_ch
            THEN -1
    END AS tendance_int_index,
    ROUND(
        (
            ta_ch_today.tag_ch::numeric - mediane_par_chantier.mediane::numeric
        )::numeric,
        1
    ) AS ecart,
    ('{"ORAGE": 1, "NUAGE": 2, "COUVERT": 3, "SOLEIL": 4}'::json->>sr.meteo)::int as meteo_int_index,
    CASE
        -- values replicated REG->DEPT
        WHEN
            UPPER(meta_ch.replicate_val_reg_to) = 'DEPT' AND z.zone_type = 'DEPT'
            THEN 'reg'::maille
        -- values replicated NAT->DEPT
        WHEN
            UPPER(meta_ch.replicate_val_nat_to) = 'DEPT' AND z.zone_type = 'DEPT'
            THEN 'nat'::maille
        -- values replicated NAT->REG
        WHEN
            UPPER(meta_ch.replicate_val_nat_to) = 'REG' AND z.zone_type = 'REG'
            THEN 'reg'::maille
    END AS donnees_maille_source

FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS t
CROSS JOIN {{ ref('get_date_bascule_depassee') }} AS date_bascule
LEFT JOIN
    {{ source('python_load', 'metadata_zones') }} AS z
    ON t.zone_id = z.zone_id
LEFT JOIN synthese_triee_par_date_last1 AS sr
    ON
        meta_ch.id = sr.chantier_id
        AND z.zone_type = sr.maille
        AND t.code_insee = sr.code_insee
LEFT JOIN
    (
        SELECT * FROM {{ ref('compute_ta_ch') }} WHERE valid_on = 'today'
    ) AS ta_ch_today
    ON meta_ch.id = ta_ch_today.chantier_id AND z.zone_id = ta_ch_today.zone_id
LEFT JOIN
    (
        SELECT * FROM {{ ref('compute_ta_ch') }} WHERE valid_on = 'prev_month'
    ) AS ta_ch_prev_month
    ON
        meta_ch.id = ta_ch_prev_month.chantier_id
        AND z.zone_id = ta_ch_prev_month.zone_id
LEFT JOIN
    {{ ref('get_ta_ch_prev_year') }} AS ta_prev_year
    ON
        meta_ch.id = ta_prev_year.chantier_id
        AND t.code = ta_prev_year.territoire_code
LEFT JOIN
    {{ ref('int_chantiers_zone_applicables') }} AS chantier_za
    ON meta_ch.id = chantier_za.chantier_id AND z.zone_id = chantier_za.zone_id
LEFT JOIN
    mailles_applicables
    ON
        meta_ch.id = mailles_applicables.chantier_id
        AND z.zone_type = mailles_applicables.maille_applicable
LEFT JOIN
    {{ ref('int_responsables_locaux') }} AS resp_locaux
    ON
        meta_ch.id = resp_locaux.chantier_id
        AND t.code = resp_locaux.territoire_code
LEFT JOIN
    {{ ref('int_coordinateurs_territoriaux') }} AS coord_territoriaux
    ON t.code = coord_territoriaux.territoire_code
LEFT JOIN
    mediane_par_chantier
    ON
        meta_ch.id = mediane_par_chantier.chantier_id
        AND z.zone_type = mediane_par_chantier.maille
--ORDER by meta_ch.id, z.zone_type
