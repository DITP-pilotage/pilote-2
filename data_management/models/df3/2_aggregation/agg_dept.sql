-- Sélection des valeurs et calculs des aggrégation pour le niveau DEPT
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation DEPT 
mesure_last_params_dept AS (
    SELECT
        mesure_lastvalmonth.id,
        mesure_lastvalmonth.date_import,
        mesure_lastvalmonth.indic_id,
        mesure_lastvalmonth.metric_date,
        mesure_lastvalmonth.metric_type,
        mesure_lastvalmonth.metric_value,
        mesure_lastvalmonth.zone_id,
        metadata_indic.vi_dept_from,
        metadata_indic.vi_dept_op,
        metadata_indic.va_dept_from,
        metadata_indic.va_dept_op,
        metadata_indic.vc_dept_from,
        metadata_indic.vc_dept_op
    FROM
        {{ ref('mesure_last') }}
            AS mesure_lastvalmonth
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} -- noqa: LT05
            AS metadata_indic
        ON mesure_lastvalmonth.indic_id = metadata_indic.indic_id
),

-- Valeurs DEPT saisies directement par l'utilisateur
mesure_last_params_dept_user AS (
    SELECT
        mesure_last_params_dept.id,
        mesure_last_params_dept.date_import,
        mesure_last_params_dept.indic_id,
        mesure_last_params_dept.metric_date,
        mesure_last_params_dept.metric_type,
        mesure_last_params_dept.metric_value,
        mesure_last_params_dept.zone_id,
        mesure_last_params_dept.vi_dept_from,
        mesure_last_params_dept.vi_dept_op,
        mesure_last_params_dept.va_dept_from,
        mesure_last_params_dept.va_dept_op,
        mesure_last_params_dept.vc_dept_from,
        mesure_last_params_dept.vc_dept_op,
        metadata_zones.maille AS zone_type
    FROM mesure_last_params_dept
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS metadata_zones
        ON mesure_last_params_dept.zone_id = metadata_zones.id
    WHERE
        (
            (
                mesure_last_params_dept.metric_type = 'vi'
                AND mesure_last_params_dept.vi_dept_from = 'user_input'
            )
            OR (
                mesure_last_params_dept.metric_type = 'va'
                AND mesure_last_params_dept.va_dept_from = 'user_input'
            )
            OR (
                mesure_last_params_dept.metric_type = 'vc'
                AND mesure_last_params_dept.vc_dept_from = 'user_input'
            )
        )
        AND metadata_zones.maille = 'DEPT'
)

-- Valeurs DEPT aggrégées: Aucune, car pas de niveau inférieur

-- On retourne donc simlement les valeurs DEPT saisies, et attendues comme tel
SELECT
    id,
    date_import,
    indic_id,
    zone_id,
    metric_date,
    metric_type,
    metric_value
FROM mesure_last_params_dept_user
