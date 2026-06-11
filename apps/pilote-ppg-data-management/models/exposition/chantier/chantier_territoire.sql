-- depends_on: {{ ref('chantier_identite') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id', 'territoire_code'],
        incremental_strategy='merge'
    )
}}

WITH mailles_applicables AS (
    SELECT
        meta_ch.id AS chantier_id,
        TRUE AS maille_est_applicable,
        UNNEST(
            CASE
                WHEN meta_ch.est_territorialise
                    THEN COALESCE(meta_ch.maille_applicable, '{NAT,DEPT,REG}')
                ELSE COALESCE(meta_ch.maille_applicable, '{NAT}')
            END
        ) AS maille_applicable
    FROM
        {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
),

mediane_par_chantier AS (
    SELECT
        ta_ch_today.chantier_id,
        zones.zone_type AS maille,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ta_ch_today.tag_ch)
            AS mediane
    FROM
        {{ ref('compute_ta_ch') }} AS ta_ch_today
    LEFT JOIN
        {{ source('python_load', 'metadata_zones') }} AS zones
        ON ta_ch_today.zone_id = zones.zone_id
    WHERE
        ta_ch_today.valid_on = 'today'
        AND ta_ch_today.tag_ch IS NOT NULL
        AND zones.zone_type <> 'NAT'
    GROUP BY
        ta_ch_today.chantier_id, zones.zone_type
),

proposition_valeur_actuelle_chantier AS (
    SELECT
        proposition_valeur.territoire_code,
        indic.chantier_id,
        COUNT(*) AS nombre_propositions_valeur_actuelle,
        SUM(CASE WHEN ponderation_reelle.poids_zone_reel > 0 THEN 1 ELSE 0 END)
            AS nombre_propositions_valeur_actuelle_ponderee
    FROM {{ ref('int_propositions_valeurs') }} AS proposition_valeur
    LEFT JOIN
        {{ source('db_schema_public', 'territoire') }} AS territoire
        ON proposition_valeur.territoire_code = territoire.code
    LEFT JOIN {{ ref('int_ponderation_reelle') }} AS ponderation_reelle
        ON
            proposition_valeur.indic_id = ponderation_reelle.indic_id
            AND territoire.zone_id = ponderation_reelle.zone_id
    LEFT JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS indic
        ON proposition_valeur.indic_id = indic.id
    WHERE indic.est_cache_dans_pilote IS FALSE
    GROUP BY proposition_valeur.territoire_code, indic.chantier_id
),

ta_ch_today AS (
    SELECT * FROM {{ ref('compute_ta_ch') }}
    WHERE valid_on = 'today'
),

ta_ch_prev_month AS (
    SELECT * FROM {{ ref('compute_ta_ch') }}
    WHERE valid_on = 'prev_month'
)

SELECT
    meta_ch.id,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.maille,
    zones.zone_id,
    ta_ch_today.tag_ch AS taux_avancement_mandat,
    ta_ch_today.date_ta AS date_taux_avancement_mandat,
    territoire.nom AS territoire_nom,
    last_meteo.meteo,
    ta_ch_prev_month.tag_ch AS taux_avancement_mandat_valeur_precedente,
    ta_ch_prev_month.date_ta AS date_taux_avancement_mandat_valeur_precedente,
    COALESCE(chantier_za.zone_est_applicable, TRUE)
    AND COALESCE(
        mailles_applicables.maille_est_applicable, FALSE
    ) AS est_applicable,
    resp_locaux.ids AS responsables_locaux_ids,
    coord_territoriaux.ids AS coordinateurs_territoriaux_ids,
    last_meteo.date_meteo::DATE AS derniere_maj_date_qualitative,
    CASE
        WHEN
            ta_ch_today.tag_ch IS NULL
            THEN NULL::TYPE_TENDANCE
        WHEN
            ta_ch_prev_month.tag_ch IS NULL
            OR ta_ch_today.tag_ch = ta_ch_prev_month.tag_ch
            THEN 'STAGNATION'::TYPE_TENDANCE
        WHEN
            ta_ch_today.tag_ch > ta_ch_prev_month.tag_ch
            THEN 'HAUSSE'::TYPE_TENDANCE
        WHEN
            ta_ch_today.tag_ch < ta_ch_prev_month.tag_ch
            THEN 'BAISSE'::TYPE_TENDANCE
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
            ta_ch_today.tag_ch::NUMERIC - mediane_par_chantier.mediane::NUMERIC
        )::NUMERIC,
        1
    ) AS ecart,
    (
        '{"ORAGE": 1, "NUAGE": 2, "COUVERT": 3, "SOLEIL": 4}'::JSON
        ->> last_meteo.meteo
    )::INT AS meteo_int_index,
    CASE
        -- values replicated REG->DEPT
        WHEN
            UPPER(meta_ch.replicate_val_reg_to) = 'DEPT'
            AND zones.zone_type = 'DEPT'
            THEN 'reg'::MAILLE
        -- values replicated NAT->DEPT
        WHEN
            UPPER(meta_ch.replicate_val_nat_to) = 'DEPT'
            AND zones.zone_type = 'DEPT'
            THEN 'nat'::MAILLE
        -- values replicated NAT->REG
        WHEN
            UPPER(meta_ch.replicate_val_nat_to) = 'REG'
            AND zones.zone_type = 'REG'
            THEN 'reg'::MAILLE
    END AS donnees_maille_source,
    COALESCE(pva_chantier.nombre_propositions_valeur_actuelle, 0)
        AS nombre_propositions_valeur_actuelle,
    COALESCE(pva_chantier.nombre_propositions_valeur_actuelle_ponderee, 0)
        AS nombre_propositions_valeur_actuelle_ponderee
FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
LEFT JOIN
    {{ source('python_load', 'metadata_zones') }} AS zones
    ON territoire.zone_id = zones.zone_id
LEFT JOIN {{ ref('int_last_meteo') }} AS last_meteo
    ON
        meta_ch.id = last_meteo.chantier_id
        AND territoire.code = last_meteo.territoire_code
LEFT JOIN ta_ch_today
    ON
        meta_ch.id = ta_ch_today.chantier_id
        AND zones.zone_id = ta_ch_today.zone_id
LEFT JOIN ta_ch_prev_month
    ON
        meta_ch.id = ta_ch_prev_month.chantier_id
        AND zones.zone_id = ta_ch_prev_month.zone_id
LEFT JOIN
    {{ ref('int_chantiers_zone_applicables') }} AS chantier_za
    ON
        meta_ch.id = chantier_za.chantier_id
        AND zones.zone_id = chantier_za.zone_id
LEFT JOIN
    mailles_applicables
    ON
        meta_ch.id = mailles_applicables.chantier_id
        AND zones.zone_type = mailles_applicables.maille_applicable
LEFT JOIN
    {{ ref('int_responsables_locaux') }} AS resp_locaux
    ON
        meta_ch.id = resp_locaux.chantier_id
        AND territoire.code = resp_locaux.territoire_code
LEFT JOIN
    {{ ref('int_coordinateurs_territoriaux') }} AS coord_territoriaux
    ON territoire.code = coord_territoriaux.territoire_code
LEFT JOIN
    mediane_par_chantier
    ON
        meta_ch.id = mediane_par_chantier.chantier_id
        AND zones.zone_type = mediane_par_chantier.maille
LEFT JOIN
    proposition_valeur_actuelle_chantier AS pva_chantier
    ON
        meta_ch.id = pva_chantier.chantier_id
        AND territoire.code = pva_chantier.territoire_code
