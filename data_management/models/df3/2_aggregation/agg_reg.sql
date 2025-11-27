-- Sélection des valeurs et calculs des aggrégation pour le niveau REG
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation REG
mesure_last_params_reg AS (
    SELECT
        mesure_lastvalmonth.id,
        mesure_lastvalmonth.date_import,
        mesure_lastvalmonth.indic_id,
        mesure_lastvalmonth.metric_date,
        mesure_lastvalmonth.metric_type,
        mesure_lastvalmonth.metric_value,
        mesure_lastvalmonth.zone_id,
        metadata_indic.vi_reg_from,
        metadata_indic.vi_reg_op,
        metadata_indic.va_reg_from,
        metadata_indic.va_reg_op,
        metadata_indic.vc_reg_from,
        metadata_indic.vc_reg_op
    FROM
        {{ ref('mesure_last_null_erase_keep_lastvalmonth') }}
            AS mesure_lastvalmonth
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }}
            AS metadata_indic
        ON mesure_lastvalmonth.indic_id = metadata_indic.indic_id
),

-- Valeurs REG saisies directement par l'utilisateur
mesure_last_params_reg_user AS (
    SELECT
        mesure_last_params_reg.id,
        mesure_last_params_reg.date_import,
        mesure_last_params_reg.indic_id,
        mesure_last_params_reg.metric_date,
        mesure_last_params_reg.metric_type,
        mesure_last_params_reg.metric_value,
        mesure_last_params_reg.zone_id,
        mesure_last_params_reg.vi_reg_from,
        mesure_last_params_reg.vi_reg_op,
        mesure_last_params_reg.va_reg_from,
        mesure_last_params_reg.va_reg_op,
        mesure_last_params_reg.vc_reg_from,
        mesure_last_params_reg.vc_reg_op,
        metadata_zones.maille AS zone_type
    FROM mesure_last_params_reg
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS metadata_zones
        ON mesure_last_params_reg.zone_id = metadata_zones.id
    WHERE
        (
            (
                mesure_last_params_reg.metric_type = 'vi'
                AND mesure_last_params_reg.vi_reg_from = 'user_input'
            )
            OR (
                mesure_last_params_reg.metric_type = 'va'
                AND mesure_last_params_reg.va_reg_from = 'user_input'
            )
            OR (
                mesure_last_params_reg.metric_type = 'vc'
                AND mesure_last_params_reg.vc_reg_from = 'user_input'
            )
        )
        AND metadata_zones.maille = 'REG'
),

-- Liste des indicateurs qui ont un paramétrage d'aggrégation pour les valeurs REG
indic_agg_from_dept AS (
    SELECT
        metadata_indic.indic_id,
        metadata_indic.vi_reg_from,
        metadata_indic.vi_reg_op,
        metadata_indic.va_reg_from,
        metadata_indic.va_reg_op,
        metadata_indic.vc_reg_from,
        metadata_indic.vc_reg_op
    FROM
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }}
            AS metadata_indic
    WHERE
        metadata_indic.vi_reg_from NOT IN ('_', 'user_input')
        OR metadata_indic.va_reg_from NOT IN ('_', 'user_input')
        OR metadata_indic.vc_reg_from NOT IN ('_', 'user_input')
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent REG
-- Ce sont ces données que la DF va aggréger
mesure_last_params_reg_from_dept AS (
    SELECT
        mesure_lastvalmonth.id,
        mesure_lastvalmonth.date_import,
        mesure_lastvalmonth.indic_id AS indic_id1,
        mesure_lastvalmonth.metric_date,
        mesure_lastvalmonth.metric_type,
        mesure_lastvalmonth.metric_value,
        mesure_lastvalmonth.zone_id,
        zone_parent.zone_type,
        zone_parent.zone_parent,
        zone_parent.zone_parent_type,
        indic_agg_from_dept.indic_id,
        indic_agg_from_dept.vi_reg_from,
        indic_agg_from_dept.vi_reg_op,
        indic_agg_from_dept.va_reg_from,
        indic_agg_from_dept.va_reg_op,
        indic_agg_from_dept.vc_reg_from,
        indic_agg_from_dept.vc_reg_op
    FROM
        {{ ref('mesure_last_null_erase_keep_lastvalmonth') }}
            AS mesure_lastvalmonth
    INNER JOIN {{ ref('zone_parent') }} AS zone_parent
        ON mesure_lastvalmonth.zone_id = zone_parent.zone_id
    RIGHT JOIN indic_agg_from_dept
        ON mesure_lastvalmonth.indic_id = indic_agg_from_dept.indic_id
    WHERE
        -- uniquement des données DEPT avec parent REG
        zone_parent.zone_type = 'DEPT' AND zone_parent.zone_parent_type = 'REG'
        -- et pour lesquels l'agg REG doit bien se faire depuis les données DEPT
        AND (
            (
                mesure_lastvalmonth.metric_type = 'vi'
                AND indic_agg_from_dept.vi_reg_from = 'DEPT'
            )
            OR (
                mesure_lastvalmonth.metric_type = 'va'
                AND indic_agg_from_dept.va_reg_from = 'DEPT'
            )
            OR (
                mesure_lastvalmonth.metric_type = 'vc'
                AND indic_agg_from_dept.vc_reg_from = 'DEPT'
            )
        )
),

-- Ici on calcule une aggrégation en somme ET en moyenne des DEPT vers REG
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg AS (
    SELECT
        -- On met id=NULL lorsque la valeur est générée par aggrégation et non issue d'une mesure saisie
        NULL::UUID AS id,
        MAX(date_import) AS date_import,
        zone_parent,
        indic_id AS indic_id1,
        metric_date,
        metric_type,
        SUM(metric_value) AS op_sum,
        AVG(metric_value) AS op_avg
    FROM mesure_last_params_reg_from_dept
    GROUP BY zone_parent, indic_id, metric_date, metric_type
),

-- On sélectionne le bon résultat de calcul de l'aggrégation 
compute_op_selected AS (
    SELECT
        compute_op_sum_avg.id,
		compute_op_sum_avg.date_import,
        compute_op_sum_avg.zone_parent,
        compute_op_sum_avg.indic_id1,
        compute_op_sum_avg.metric_date,
        compute_op_sum_avg.metric_type,
        compute_op_sum_avg.op_sum,
        compute_op_sum_avg.op_avg,
        indic_agg_from_dept.indic_id,
        indic_agg_from_dept.vi_reg_from,
        indic_agg_from_dept.vi_reg_op,
        indic_agg_from_dept.va_reg_from,
        indic_agg_from_dept.va_reg_op,
        indic_agg_from_dept.vc_reg_from,
        indic_agg_from_dept.vc_reg_op,
        CASE
            WHEN compute_op_sum_avg.metric_type = 'vi' AND indic_agg_from_dept.vi_reg_op = 'sum' THEN op_sum
            WHEN compute_op_sum_avg.metric_type = 'vi' AND indic_agg_from_dept.vi_reg_op = 'avg' THEN op_avg
            WHEN compute_op_sum_avg.metric_type = 'va' AND indic_agg_from_dept.va_reg_op = 'sum' THEN op_sum
            WHEN compute_op_sum_avg.metric_type = 'va' AND indic_agg_from_dept.va_reg_op = 'avg' THEN op_avg
            WHEN compute_op_sum_avg.metric_type = 'vc' AND indic_agg_from_dept.vc_reg_op = 'sum' THEN op_sum
            WHEN compute_op_sum_avg.metric_type = 'vc' AND indic_agg_from_dept.vc_reg_op = 'avg' THEN op_avg
            -- Si opération non supportée, ie hors de [sum, avg]
            ELSE -1.212121
        END AS op_selected
    FROM compute_op_sum_avg
	LEFT JOIN indic_agg_from_dept
		ON compute_op_sum_avg.indic_id1 = indic_agg_from_dept.indic_id
),

-- On sélectionne qq colonne puis tri
mesure_last_params_reg_aggregated AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_parent AS zone_id,
        metric_date,
        metric_type,
        op_selected AS metric_value
    FROM compute_op_selected
    --order by indic_id, zone_id, metric_date, metric_type
)

-- On retourne donc les valeurs REG saisies, et attendues comme tel
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM mesure_last_params_reg_user
UNION ALL
-- ET les valeurs agg
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM mesure_last_params_reg_aggregated
