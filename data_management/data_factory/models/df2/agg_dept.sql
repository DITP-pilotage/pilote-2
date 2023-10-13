-- Sélection des valeurs et calculs des aggrégation pour le niveau DEPT
--      en fonction des paramètres


with 
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation DEPT 
mesure_last_params_dept as (
    select 
        a.indic_id , metric_date, metric_type, metric_value , zone_id,
        b.vi_dept_from , b.vi_dept_op , b.va_dept_from, b.va_dept_op, b.vc_dept_from , b.vc_dept_op 
    from {{ ref('mesure_select_last') }} a
    left join {{ ref('metadata_parametrage_indicateurs') }} b 
    ON a.indic_id = b.indic_id
), 
-- Valeurs DEPT saisies directement par l'utilisateur
mesure_last_params_dept_user as (
    select * from mesure_last_params_dept
    where 
        (metric_type='vi' and vi_dept_from='user_input') OR
        (metric_type='va' and va_dept_from='user_input') OR
        (metric_type='vc' and va_dept_from='user_input')
)

-- Valeurs DEPT aggrégées: Aucune, car pas de niveau inférieur

-- On retourne donc simlement les valeurs DEPT saisies, et attendues comme tel
select * from mesure_last_params_dept_user