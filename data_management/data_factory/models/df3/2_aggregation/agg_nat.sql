-- Sélection des valeurs et calculs des aggrégation pour le niveau NAT
--      en fonction des paramètres


with 
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation NAT
mesure_last_params_nat as (
    select 
        a.indic_id , metric_date, metric_type, metric_value , zone_id,
        b.vi_nat_from , b.vi_nat_op , b.va_nat_from, b.va_nat_op, b.vc_nat_from , b.vc_nat_op 
    from {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} a
    left join {{ ref('metadata_parametrage_indicateurs') }} b 
    ON a.indic_id = b.indic_id
), 
-- Valeurs NAT saisies directement par l'utilisateur
mesure_last_params_nat_user as (
    select a.*, b.zone_type from mesure_last_params_nat a
    left join {{ ref('metadata_zones') }} b on a.zone_id=b.zone_id
    where 
        ((metric_type='vi' and vi_nat_from='user_input') OR
        (metric_type='va' and va_nat_from='user_input') OR
        (metric_type='vc' and vc_nat_from='user_input')) and
		zone_type='NAT'
),


-- Liste des indicateurs qui ont un paramétrage d'aggrégation pour les valeurs NAT
indic_agg_to_nat as (
	select b.indic_id, b.vi_nat_from , b.vi_nat_op, b.va_nat_from , b.va_nat_op, b.vc_nat_from , b.vc_nat_op 
	from {{ ref('metadata_parametrage_indicateurs') }} b
	where 
		b.vi_nat_from not in ('_', 'user_input') OR
		b.va_nat_from not in ('_', 'user_input') OR
		b.vc_nat_from not in ('_', 'user_input')
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont REG avec un parent NAT
-- Ce sont ces données que la DF va aggréger
mesure_last_params_nat_from_reg as (
	select a.indic_id as indic_id1 , metric_date , metric_type , metric_value::float, a.zone_id,
	b.zone_type, b.zone_parent , b.zone_parent_type ,
	c.*
	from {{ ref('agg_reg') }} a
	inner join {{ ref('zone_parent') }} b on a.zone_id = b.zone_id 
	right join indic_agg_to_nat c on a.indic_id =c.indic_id
	where 
		-- uniquement des données REG avec parent NAT
		zone_type='REG' and zone_parent_type='NAT' and
		-- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
		( (metric_type='vi' and vi_nat_from='REG') or (metric_type='va' and va_nat_from='REG') or (metric_type='vc' and vc_nat_from='REG'))
),

-- On prend chaque mesure
--  on lui associe sa zone parente
--  on lui associe ses paramètres d'aggrégation
--  et on sélectionne que les valeurs qui sont DEPT avec un parent NAT
mesure_last_params_nat_from_dept as (
	select a.indic_id as indic_id1 , metric_date , metric_type , metric_value::float, a.zone_id,
	b.zone_type, b.zone_parent_parent as zone_parent , b.zone_parent_parent_type as zone_parent_type ,
	c.*
	from {{ ref('agg_dept') }} a
	inner join {{ ref('zone_parent_parent') }} b on a.zone_id = b.zone_id 
	right join indic_agg_to_nat c on a.indic_id =c.indic_id
	where 
		-- uniquement des données DEPT avec parent NAT
		b.zone_type='DEPT' and zone_parent_parent_type='NAT' and
		-- et pour lesquels l'agg NAT doit bien se faire depuis les données REG
		( (metric_type='vi' and vi_nat_from='DEPT') or (metric_type='va' and va_nat_from='DEPT') or (metric_type='vc' and vc_nat_from='DEPT'))
),

-- Union des valeurs aggrégées depuis DEPT et REG
mesure_last_params_nat_from_dept_or_reg as (
	select * from mesure_last_params_nat_from_dept
	union
	select * from mesure_last_params_nat_from_reg
),


-- Ici on calcule une aggrégation en somme ET en moyenne des REG vers NAT
--	La sélection de la valeur correcte se fera ensuite en fonction des paramètres
compute_op_sum_avg as (
	select 
		zone_parent, indic_id as indic_id1, metric_date, metric_type, 
		sum(metric_value::float) as op_sum,
		avg(metric_value::float) as op_avg
	from mesure_last_params_nat_from_dept_or_reg
	group by zone_parent, indic_id, metric_date, metric_type
),

-- On sélectionne le bon résultat de calcul de l'aggrégation 
compute_op_selected as (
	select b.*, a.*,
	case 
        WHEN metric_type='vi' AND vi_nat_op='sum' THEN op_sum
        WHEN metric_type='vi' AND vi_nat_op='avg' THEN op_avg
        WHEN metric_type='va' AND va_nat_op='sum' THEN op_sum
        WHEN metric_type='va' AND va_nat_op='avg' THEN op_avg
        WHEN metric_type='vc' AND vc_nat_op='sum' THEN op_sum
        WHEN metric_type='vc' AND vc_nat_op='avg' THEN op_avg
        -- Si opération non supportée, ie hors de [sum, avg]
		else -1.212121
	end as op_selected
	from indic_agg_to_nat a
	right join compute_op_sum_avg b on a.indic_id=b.indic_id1
),

-- On sélectionne qq colonne puis tri
mesure_last_params_nat_aggregated as (
    select 
        indic_id,
        zone_parent as zone_id,
        metric_date, metric_type,
        op_selected as metric_value
    from compute_op_selected
    order by indic_id, zone_id, metric_date, metric_type
)


-- On retourne donc les valeurs NAT saisies, et attendues comme tel
select indic_id, zone_id, metric_date, metric_type, metric_value::float from mesure_last_params_nat_user
union
-- ET les valeurs agg
select * from mesure_last_params_nat_aggregated
