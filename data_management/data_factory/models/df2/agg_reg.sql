-- Sélection des valeurs et calculs des aggrégation pour le niveau REG
--      en fonction des paramètres


with 
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation REG
mesure_last_params_reg as (
    select 
        a.indic_id , metric_date, metric_type, metric_value , zone_id,
        b.vi_reg_from , b.vi_reg_op , b.va_reg_from, b.va_reg_op, b.vc_reg_from , b.vc_reg_op 
    from "postgres"."df2"."mesure_select_last" a
    left join "postgres"."raw_data"."metadata_parametrage_indicateurs" b 
    ON a.indic_id = b.indic_id
), 
-- Valeurs REG saisies directement par l'utilisateur
mesure_last_params_reg_user as (
    select * from mesure_last_params_reg
    where 
        (metric_type='vi' and vi_reg_from='user_input') OR
        (metric_type='va' and va_reg_from='user_input') OR
        (metric_type='vc' and va_reg_from='user_input')
)

-- Valeurs REG aggrégées: TODO

-- On retourne donc simlement les valeurs DEPT saisies, et attendues comme tel + les valeurs agg
select * from mesure_last_params_reg_user