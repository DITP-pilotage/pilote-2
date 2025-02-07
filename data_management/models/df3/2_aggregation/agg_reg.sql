-- Sélection des valeurs et calculs des aggrégation pour le niveau REG
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation REG
mesure_last_params_reg AS (
    SELECT
        a.id,
        a.date_import,
        a.indic_id,
        metric_date,
        metric_type,
        metric_value,
        zone_id,
        b.vi_reg_from,
        b.vi_reg_op,
        b.va_reg_from,
        b.va_reg_op,
        b.vc_reg_from,
        b.vc_reg_op
    FROM {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} AS a
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS b
        ON a.indic_id = b.indic_id
),

-- Valeurs REG saisies directement par l'utilisateur
mesure_last_params_reg_user AS (
    SELECT
        a.*,
        b.maille AS zone_type
    FROM mesure_last_params_reg AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS b ON a.zone_id = b.id
    WHERE
        (
            (metric_type = 'vi' AND vi_reg_from = 'user_input')
            OR (metric_type = 'va' AND va_reg_from = 'user_input')
            OR (metric_type = 'vc' AND vc_reg_from = 'user_input')
        )
        AND b.maille = 'REG'
),


-- Liste des indicateurs qui ont un paramétrage d'aggrégation pour les valeurs REG
indic_agg_from_dept AS (
    SELECT
        b.indic_id,
        b.vi_reg_from,
        b.vi_reg_op,
        b.va_reg_from,
        b.va_reg_op,
        b.vc_reg_from,
        b.vc_reg_op
    FROM
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS b
    WHERE
        b.vi_reg_from NOT IN ('_', 'user_input')
        OR b.va_reg_from NOT IN ('_', 'user_input')
        OR b.vc_reg_from NOT IN ('_', 'user_input')
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent REG
-- Ce sont ces données que la DF va aggréger
mesure_last_params_reg_from_dept AS (
    SELECT
        a.id,
        a.date_import,
        a.indic_id AS indic_id1,
        metric_date,
        metric_type,
        metric_value::float,
        a.zone_id,
        b.zone_type,
        b.zone_parent,
        b.zone_parent_type,
        c.*
    FROM {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} AS a
    INNER JOIN {{ ref('zone_parent') }} AS b ON a.zone_id = b.zone_id
    RIGHT JOIN indic_agg_from_dept AS c ON a.indic_id = c.indic_id
    WHERE
        -- uniquement des données REG avec parent NAT
        zone_type = 'DEPT' AND zone_parent_type = 'REG'
        -- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
        AND (
            (metric_type = 'vi' AND vi_reg_from = 'DEPT')
            OR (metric_type = 'va' AND va_reg_from = 'DEPT')
            OR (metric_type = 'vc' AND vc_reg_from = 'DEPT')
        )
),

-- Ici on calcule une aggrégation en somme ET en moyenne des DEPT vers REG
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg AS (
    SELECT
        -- On met id=NULL lorsque la valeur est générée par aggrégation et non issue d'une mesure saisie
        null::uuid AS id,
        max(date_import) AS date_import,
        zone_parent,
        indic_id AS indic_id1,
        metric_date,
        metric_type,
        sum(metric_value::float) AS op_sum,
        avg(metric_value::float) AS op_avg
    FROM mesure_last_params_reg_from_dept
    GROUP BY zone_parent, indic_id, metric_date, metric_type
),

-- On sélectionne le bon résultat de calcul de l'aggrégation 
compute_op_selected AS (
    SELECT
        b.*,
        a.*,
        CASE
            WHEN metric_type = 'vi' AND vi_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'vi' AND vi_reg_op = 'avg' THEN op_avg
            WHEN metric_type = 'va' AND va_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'va' AND va_reg_op = 'avg' THEN op_avg
            WHEN metric_type = 'vc' AND vc_reg_op = 'sum' THEN op_sum
            WHEN metric_type = 'vc' AND vc_reg_op = 'avg' THEN op_avg
            -- Si opération non supportée, ie hors de [sum, avg]
            ELSE -1.212121
        END AS op_selected
    FROM indic_agg_from_dept AS a
    RIGHT JOIN compute_op_sum_avg AS b ON a.indic_id = b.indic_id1
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
    ORDER BY indic_id, zone_id, metric_date, metric_type
)




-- On retourne donc les valeurs REG saisies, et attendues comme tel
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value::float
FROM mesure_last_params_reg_user
UNION
-- ET les valeurs agg
SELECT * FROM mesure_last_params_reg_aggregated
