-- Sélection des valeurs et calculs des aggrégation pour le niveau DEPT
--      en fonction des paramètres


WITH
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation DEPT 
mesure_last_params_dept AS (
    SELECT
        a.id, 
        a.date_import, 
        a.indic_id,
        metric_date,
        metric_type,
        metric_value,
        zone_id,
        b.vi_dept_from,
        b.vi_dept_op,
        b.va_dept_from,
        b.va_dept_op,
        b.vc_dept_from,
        b.vc_dept_op
    FROM {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} AS a
    LEFT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS b
        ON a.indic_id = b.indic_id
),

-- Valeurs DEPT saisies directement par l'utilisateur
mesure_last_params_dept_user AS (
    SELECT
        a.*,
        b.maille as zone_type
    FROM mesure_last_params_dept AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS b ON a.zone_id = b.id
    WHERE
        (
            (metric_type = 'vi' AND vi_dept_from = 'user_input')
            OR (metric_type = 'va' AND va_dept_from = 'user_input')
            OR (metric_type = 'vc' AND vc_dept_from = 'user_input')
        )
        AND b.maille = 'DEPT'
)

-- Valeurs DEPT aggrégées: Aucune, car pas de niveau inférieur

-- On retourne donc simlement les valeurs DEPT saisies, et attendues comme tel
SELECT * FROM mesure_last_params_dept_user
