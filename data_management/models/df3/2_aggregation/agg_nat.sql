-- Sélection des valeurs et calculs des aggrégation pour le niveau NAT
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation NAT
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
        {{ ref('mesure_last') }}
            AS mesure_lastvalmonth
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS metadata_indic
        ON mesure_lastvalmonth.indic_id = metadata_indic.indic_id
),

-- Valeurs NAT saisies directement par l'utilisateur
mesure_last_params_nat_user AS (
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
        (
            (
                mesure_last_params_nat.metric_type = 'vi'
                AND mesure_last_params_nat.vi_nat_from = 'user_input'
            )
            OR (
                mesure_last_params_nat.metric_type = 'va'
                AND mesure_last_params_nat.va_nat_from = 'user_input'
            )
            OR (
                mesure_last_params_nat.metric_type = 'vc'
                AND mesure_last_params_nat.vc_nat_from = 'user_input'
            )
        )
        AND metadata_zones.maille = 'NAT'
),

-- Liste des indicateurs qui ont un paramétrage d'agg pour les valeurs NAT
indic_agg_to_nat AS (
    SELECT
        metadata_indic.indic_id,
        metadata_indic.vi_nat_from,
        metadata_indic.vi_nat_op,
        metadata_indic.va_nat_from,
        metadata_indic.va_nat_op,
        metadata_indic.vc_nat_from,
        metadata_indic.vc_nat_op
    FROM
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS metadata_indic
    WHERE
        metadata_indic.vi_nat_from NOT IN ('_', 'user_input')
        OR metadata_indic.va_nat_from NOT IN ('_', 'user_input')
        OR metadata_indic.vc_nat_from NOT IN ('_', 'user_input')
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont REG avec un parent NAT
-- Ce sont ces données que la DF va aggréger
mesure_last_params_nat_from_reg AS (
    SELECT
        agg_reg.id,
        agg_reg.date_import,
        agg_reg.indic_id AS indic_id1,
        agg_reg.metric_date,
        agg_reg.metric_type,
        agg_reg.metric_value,
        agg_reg.zone_id,
        zone_parent.zone_type,
        zone_parent.zone_parent,
        zone_parent.zone_parent_type,
        indic_agg_to_nat.indic_id,
        indic_agg_to_nat.vi_nat_from,
        indic_agg_to_nat.vi_nat_op,
        indic_agg_to_nat.va_nat_from,
        indic_agg_to_nat.va_nat_op,
        indic_agg_to_nat.vc_nat_from,
        indic_agg_to_nat.vc_nat_op
    FROM {{ ref('agg_reg') }} AS agg_reg
    INNER JOIN
        {{ ref('zone_parent') }} AS zone_parent
        ON agg_reg.zone_id = zone_parent.zone_id
    -- TODO: Remove right join and use left join
    RIGHT JOIN indic_agg_to_nat -- noqa: CV08
        ON agg_reg.indic_id = indic_agg_to_nat.indic_id
    WHERE
        -- uniquement des données REG avec parent NAT
        zone_parent.zone_type = 'REG' AND zone_parent.zone_parent_type = 'NAT'
        -- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
        AND (
            (
                agg_reg.metric_type = 'vi'
                AND indic_agg_to_nat.vi_nat_from = 'REG'
            )
            OR (
                agg_reg.metric_type = 'va'
                AND indic_agg_to_nat.va_nat_from = 'REG'
            )
            OR (
                agg_reg.metric_type = 'vc'
                AND indic_agg_to_nat.vc_nat_from = 'REG'
            )
        )
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent NAT
mesure_last_params_nat_from_dept AS (
    SELECT
        agg_dept.id,
        agg_dept.date_import,
        agg_dept.indic_id AS indic_id1,
        agg_dept.metric_date,
        agg_dept.metric_type,
        agg_dept.metric_value,
        agg_dept.zone_id,
        zone_parent_parent.zone_type,
        zone_parent_parent.zone_parent_parent AS zone_parent,
        zone_parent_parent.zone_parent_parent_type AS zone_parent_type,
        indic_agg_to_nat.indic_id,
        indic_agg_to_nat.vi_nat_from,
        indic_agg_to_nat.vi_nat_op,
        indic_agg_to_nat.va_nat_from,
        indic_agg_to_nat.va_nat_op,
        indic_agg_to_nat.vc_nat_from,
        indic_agg_to_nat.vc_nat_op
    FROM {{ ref('agg_dept') }} AS agg_dept
    INNER JOIN
        {{ ref('zone_parent_parent') }} AS zone_parent_parent
        ON agg_dept.zone_id = zone_parent_parent.zone_id
    -- TODO: Remove right join and use left join
    RIGHT JOIN indic_agg_to_nat -- noqa: CV08
        ON agg_dept.indic_id = indic_agg_to_nat.indic_id -- noqa: LT05
    WHERE
        -- uniquement des données DEPT avec parent NAT
        zone_parent_parent.zone_type = 'DEPT'
        AND zone_parent_parent.zone_parent_parent_type = 'NAT'
        -- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
        AND (
            (
                agg_dept.metric_type = 'vi'
                AND indic_agg_to_nat.vi_nat_from = 'DEPT'
            )
            OR (
                agg_dept.metric_type = 'va'
                AND indic_agg_to_nat.va_nat_from = 'DEPT'
            )
            OR (
                agg_dept.metric_type = 'vc'
                AND indic_agg_to_nat.vc_nat_from = 'DEPT'
            )
        )
),

-- Union des valeurs aggrégées depuis DEPT et REG
mesure_last_params_nat_from_dept_or_reg AS (
    SELECT
	    id,
        date_import,
        indic_id1,
        metric_date,
        metric_type,
        metric_value,
        zone_id,
        zone_type,
        zone_parent,
        zone_parent_type,
        indic_id,
        vi_nat_from,
        vi_nat_op,
        va_nat_from,
        va_nat_op,
        vc_nat_from,
        vc_nat_op
    FROM mesure_last_params_nat_from_dept
    UNION ALL
    SELECT
	    id,
        date_import,
        indic_id1,
        metric_date,
        metric_type,
        metric_value,
        zone_id,
        zone_type,
        zone_parent,
        zone_parent_type,
        indic_id,
        vi_nat_from,
        vi_nat_op,
        va_nat_from,
        va_nat_op,
        vc_nat_from,
        vc_nat_op
    FROM mesure_last_params_nat_from_reg
),

-- Ici on calcule une aggrégation en somme ET en moyenne des REG vers NAT
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg AS (
    SELECT
        -- On met id=NULL lorsque la valeur est générée par agg
        -- et non issue d'une mesure saisie
        NULL::UUID AS id,
        MAX(date_import) AS date_import,
        zone_parent,
        indic_id AS indic_id1,
        metric_date,
        metric_type,
        SUM(metric_value) AS op_sum,
        AVG(metric_value) AS op_avg
    FROM mesure_last_params_nat_from_dept_or_reg
    GROUP BY
        zone_parent, indic_id, metric_date, metric_type
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
        indic_agg_to_nat.indic_id,
        indic_agg_to_nat.vi_nat_from,
        indic_agg_to_nat.vi_nat_op,
        indic_agg_to_nat.va_nat_from,
        indic_agg_to_nat.va_nat_op,
        indic_agg_to_nat.vc_nat_from,
        indic_agg_to_nat.vc_nat_op,
        CASE
            WHEN
                compute_op_sum_avg.metric_type = 'vi'
                AND indic_agg_to_nat.vi_nat_op = 'sum'
                THEN compute_op_sum_avg.op_sum
            WHEN
                compute_op_sum_avg.metric_type = 'vi'
                AND indic_agg_to_nat.vi_nat_op = 'avg'
                THEN compute_op_sum_avg.op_avg
            WHEN
                compute_op_sum_avg.metric_type = 'va'
                AND indic_agg_to_nat.va_nat_op = 'sum'
                THEN compute_op_sum_avg.op_sum
            WHEN
                compute_op_sum_avg.metric_type = 'va'
                AND indic_agg_to_nat.va_nat_op = 'avg'
                THEN compute_op_sum_avg.op_avg
            WHEN
                compute_op_sum_avg.metric_type = 'vc'
                AND indic_agg_to_nat.vc_nat_op = 'sum'
                THEN compute_op_sum_avg.op_sum
            WHEN
                compute_op_sum_avg.metric_type = 'vc'
                AND indic_agg_to_nat.vc_nat_op = 'avg'
                THEN compute_op_sum_avg.op_avg
            -- Si opération non supportée, ie hors de [sum, avg]
            ELSE -1.212121::FLOAT
        END AS op_selected
    FROM compute_op_sum_avg
    LEFT JOIN indic_agg_to_nat
        ON compute_op_sum_avg.indic_id1 = indic_agg_to_nat.indic_id
),

-- On sélectionne qq colonne puis tri
mesure_last_params_nat_aggregated AS (
    SELECT
        id,
        date_import,
        indic_id,
        zone_parent AS zone_id,
        metric_date,
        metric_type,
        op_selected AS metric_value
    FROM compute_op_selected
    --order by indic_id, zone_id, metric_date, metric_type -- noqa: LT05
)

-- On retourne donc les valeurs NAT saisies, et attendues comme tel
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM mesure_last_params_nat_user
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
FROM mesure_last_params_nat_aggregated
