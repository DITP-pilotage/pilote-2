-- Sélection des valeurs et calculs des aggrégation pour le niveau REG
--      en fonction des paramètres


with 
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation REG
mesure_last_params_reg as (
    select 
        a.id, a.date_import, a.indic_id , metric_date, metric_type, metric_value , zone_id,
        b.vi_reg_from , b.vi_reg_op , b.va_reg_from, b.va_reg_op, b.vc_reg_from , b.vc_reg_op 
    from {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} a
    left join {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} b 
    ON a.indic_id = b.indic_id
), 
-- Valeurs REG saisies directement par l'utilisateur
mesure_last_params_reg_user as (
    select a.*, b.zone_type from mesure_last_params_reg a
    left join {{ ref('metadata_zones') }} b on a.zone_id=b.zone_id
    where 
        ((metric_type='vi' and vi_reg_from='user_input') OR
        (metric_type='va' and va_reg_from='user_input') OR
        (metric_type='vc' and vc_reg_from='user_input')) and
		zone_type='REG'
),


-- Liste des indicateurs qui ont un paramétrage d'aggrégation pour les valeurs REG
indic_agg_from_dept as (
	select b.indic_id, b.vi_reg_from , b.vi_reg_op, b.va_reg_from , b.va_reg_op, b.vc_reg_from , b.vc_reg_op 
	from {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} b
	where 
		b.vi_reg_from not in ('_', 'user_input') OR
		b.va_reg_from not in ('_', 'user_input') OR
		b.vc_reg_from not in ('_', 'user_input')
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent REG
-- Ce sont ces données que la DF va aggréger
mesure_last_params_reg_from_dept as (
	select a.id, a.date_import, a.indic_id as indic_id1 , metric_date , metric_type , metric_value::float, a.zone_id,
	b.zone_type, b.zone_parent , b.zone_parent_type ,
	c.*
	from {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} a
	inner join {{ ref('zone_parent') }} b on a.zone_id = b.zone_id 
	right join indic_agg_from_dept c on a.indic_id =c.indic_id
	where 
		-- uniquement des données REG avec parent NAT
		zone_type='DEPT' and zone_parent_type='REG' and
		-- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
		( (metric_type='vi' and vi_reg_from='DEPT') or (metric_type='va' and va_reg_from='DEPT') or (metric_type='vc' and vc_reg_from='DEPT'))
),

-- Ici on calcule une aggrégation en somme ET en moyenne des DEPT vers REG
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg as (
	select 
		-- On met id=NULL lorsque la valeur est générée par aggrégation et non issue d'une mesure saisie
		null::uuid as id, 
		null::date as date_import,
		zone_parent, indic_id as indic_id1, metric_date, metric_type, 
		sum(metric_value::float) as op_sum,
		avg(metric_value::float) as op_avg
	from mesure_last_params_reg_from_dept
	group by zone_parent, indic_id, metric_date, metric_type
),

-- On sélectionne le bon résultat de calcul de l'aggrégation 
compute_op_selected as (
	select b.*, a.*,
	case 
        WHEN metric_type='vi' AND vi_reg_op='sum' THEN op_sum
        WHEN metric_type='vi' AND vi_reg_op='avg' THEN op_avg
        WHEN metric_type='va' AND va_reg_op='sum' THEN op_sum
        WHEN metric_type='va' AND va_reg_op='avg' THEN op_avg
        WHEN metric_type='vc' AND vc_reg_op='sum' THEN op_sum
        WHEN metric_type='vc' AND vc_reg_op='avg' THEN op_avg
        -- Si opération non supportée, ie hors de [sum, avg]
		else -1.212121
	end as op_selected
	from indic_agg_from_dept a
	right join compute_op_sum_avg b on a.indic_id=b.indic_id1
),

-- On sélectionne qq colonne puis tri
mesure_last_params_reg_aggregated as (
    select 
		id,
		date_import,
        indic_id,
        zone_parent as zone_id,
        metric_date, metric_type,
        op_selected as metric_value
    from compute_op_selected
    order by indic_id, zone_id, metric_date, metric_type
)




-- On retourne donc les valeurs REG saisies, et attendues comme tel
select id, date_import, indic_id, zone_id, metric_date, metric_type, metric_value::float from mesure_last_params_reg_user
union
-- ET les valeurs agg
select * from mesure_last_params_reg_aggregated
