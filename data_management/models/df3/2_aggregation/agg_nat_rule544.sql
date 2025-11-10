-- Application de la règle 544
--  ie choix de la VC NAT saisie si le cumul retourne NULL

WITH source AS -- On prend les VC NAT de la table agg_nat
(
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        metric_value
    FROM {{ ref('agg_nat') }}
    WHERE zone_id = 'FRANCE' AND metric_type IN ('vc', 'vi')
),

-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation NAT (cf agg_nat)
mesure_last_params_nat AS (
    SELECT
        mesure_lastvalmonth.id,
        mesure_lastvalmonth.date_import,
        mesure_lastvalmonth.indic_id,
        mesure_lastvalmonth.metric_date,
        mesure_lastvalmonth.metric_type,
        mesure_lastvalmonth.metric_value,
        mesure_lastvalmonth.zone_id,
        metadata_indic.vi_nat_from,
        metadata_indic.vi_nat_op,
        metadata_indic.va_nat_from,
        metadata_indic.va_nat_op,
        metadata_indic.vc_nat_from,
        metadata_indic.vc_nat_op
    FROM
        {{ ref('mesure_last_null_erase_keep_lastvalmonth') }}
            AS mesure_lastvalmonth
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS metadata_indic
        ON mesure_lastvalmonth.indic_id = metadata_indic.indic_id
),

-- Les VC FR saisies, **qui ne devraient pas être prises en compte**!
-- (vc_nat_from<>'user_input')
mesure_last_params_nat_all_vc AS (
    SELECT
        mesure_last_params_nat.id,
        mesure_last_params_nat.date_import,
        mesure_last_params_nat.indic_id,
        mesure_last_params_nat.metric_date,
        mesure_last_params_nat.metric_type,
        mesure_last_params_nat.metric_value,
        mesure_last_params_nat.zone_id,
        mesure_last_params_nat.vi_nat_from,
        mesure_last_params_nat.vi_nat_op,
        mesure_last_params_nat.va_nat_from,
        mesure_last_params_nat.va_nat_op,
        mesure_last_params_nat.vc_nat_from,
        mesure_last_params_nat.vc_nat_op,
        metadata_zones.maille AS zone_type
    FROM mesure_last_params_nat
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS metadata_zones
        ON mesure_last_params_nat.zone_id = metadata_zones.id
    WHERE
        mesure_last_params_nat.zone_id = 'FRANCE'
        AND mesure_last_params_nat.metric_type = 'vc'
        AND mesure_last_params_nat.vc_nat_from <> 'user_input'
),

-- Les VI FR saisies, **qui ne devraient pas être prises en compte**!
-- (vi_nat_from<>'user_input')
mesure_last_params_nat_all_vi AS (
    SELECT
        mesure_last_params_nat.id,
        mesure_last_params_nat.date_import,
        mesure_last_params_nat.indic_id,
        mesure_last_params_nat.metric_date,
        mesure_last_params_nat.metric_type,
        mesure_last_params_nat.metric_value,
        mesure_last_params_nat.zone_id,
        mesure_last_params_nat.vi_nat_from,
        mesure_last_params_nat.vi_nat_op,
        mesure_last_params_nat.va_nat_from,
        mesure_last_params_nat.va_nat_op,
        mesure_last_params_nat.vc_nat_from,
        mesure_last_params_nat.vc_nat_op,
        metadata_zones.maille AS zone_type
    FROM mesure_last_params_nat
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS metadata_zones
        ON mesure_last_params_nat.zone_id = metadata_zones.id
    WHERE
        mesure_last_params_nat.zone_id = 'FRANCE'
        AND mesure_last_params_nat.metric_type = 'vi'
        AND mesure_last_params_nat.vc_nat_from <> 'user_input'
),

-- Jointure des valeurs correctes (from source)
--	et de valeurs illegalement saisies en VC
join_correct_and_illegal_values_vc AS (
    SELECT
        COALESCE(source.id, illegal_vc.id) AS id,
        COALESCE(source.date_import, illegal_vc.date_import) AS date_import,
        COALESCE(source.indic_id, illegal_vc.indic_id) AS indic_id,
        COALESCE(source.zone_id, illegal_vc.zone_id) AS zone_id,
        COALESCE(source.metric_date, illegal_vc.metric_date) AS metric_date,
        COALESCE(source.metric_type, illegal_vc.metric_type) AS metric_type,
        source.metric_value AS computed_value,
        illegal_vc.metric_value AS illegal_input_value
    FROM source
    FULL JOIN mesure_last_params_nat_all_vc AS illegal_vc
        ON
            source.indic_id = illegal_vc.indic_id
            AND source.zone_id = illegal_vc.zone_id
            AND source.metric_date = illegal_vc.metric_date
            AND source.metric_type = illegal_vc.metric_type
),

-- Jointure des valeurs précédentes
--	et de valeurs illegalement saisies en vi
join_correct_and_illegal_values_vi AS (
    SELECT
        COALESCE(source.id, illegal_vi.id) AS id,
        COALESCE(source.date_import, illegal_vi.date_import) AS date_import,
        COALESCE(source.indic_id, illegal_vi.indic_id) AS indic_id,
        COALESCE(source.zone_id, illegal_vi.zone_id) AS zone_id,
        COALESCE(source.metric_date, illegal_vi.metric_date) AS metric_date,
        COALESCE(source.metric_type, illegal_vi.metric_type) AS metric_type,
        source.metric_value AS computed_value,
        illegal_vi.metric_value AS illegal_input_value
    FROM source
    FULL JOIN mesure_last_params_nat_all_vi AS illegal_vi
        ON
            source.indic_id = illegal_vi.indic_id
            AND source.zone_id = illegal_vi.zone_id
            AND source.metric_date = illegal_vi.metric_date
            AND source.metric_type = illegal_vi.metric_type
)

-- Jointure des VC+VI avec le reste des valeurs NAT aggrégées (VA)
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM (
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        -- Si pas de computed_value, alors on prend la illegal_value
        COALESCE(computed_value, illegal_input_value::FLOAT) AS metric_value
    FROM join_correct_and_illegal_values_vc
    WHERE metric_type = 'vc'
)
UNION ALL
(
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        -- Si pas de computed_value, alors on prend la illegal_value
        COALESCE(computed_value, illegal_input_value::FLOAT) AS metric_value
    FROM join_correct_and_illegal_values_vi
    WHERE metric_type = 'vi'
)
UNION ALL
(
    SELECT
        id,
        date_import,
        indic_id,
        zone_id,
        metric_date,
        metric_type,
        metric_value
    FROM {{ ref('agg_nat') }}
    WHERE metric_type = 'va'
)
