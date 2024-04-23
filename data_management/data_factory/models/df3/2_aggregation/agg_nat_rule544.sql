-- Application de la règle 544
--  ie choix de la VC NAT saisie si le cumul retourne NULL

with source as 
-- On prend les VC NAT de la table agg_nat
(select * from {{ ref('agg_nat') }} where zone_id='FRANCE' and metric_type in ('vc','vi')),
-- On sélectionne certaines colonnes de la table des mesures valides
--	et on y ajoute les paramètres d'aggrégation NAT (cf agg_nat)
mesure_last_params_nat as (
    select 
        a.indic_id , metric_date, metric_type, metric_value , zone_id,
        b.vi_nat_from , b.vi_nat_op , b.va_nat_from, b.va_nat_op, b.vc_nat_from , b.vc_nat_op 
    from {{ ref('mesure_last_null_erase_keep_lastvalmonth') }} a
    left join {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} b 
    ON a.indic_id = b.indic_id
), 
-- Les VC FR saisies, **qui ne devraient pas être prises en compte**! (vc_nat_from<>'user_input')
mesure_last_params_nat_all_vc as (
    select a.*, b.zone_type from mesure_last_params_nat a
    left join {{ ref('metadata_zones') }} b on a.zone_id=b.zone_id
    where 
		a.zone_id='FRANCE' and metric_type='vc' and vc_nat_from<>'user_input'
),
-- Les VI FR saisies, **qui ne devraient pas être prises en compte**! (vi_nat_from<>'user_input')
mesure_last_params_nat_all_vi as (
    select a.*, b.zone_type from mesure_last_params_nat a
    left join {{ ref('metadata_zones') }} b on a.zone_id=b.zone_id
    where 
		a.zone_id='FRANCE' and metric_type='vi' and vc_nat_from<>'user_input'
),
-- Jointure des valeurs correctes (from source)
--	et de valeurs illegalement saisies en VC
join_correct_and_illegal_values_vc as (
select 
    coalesce(a.indic_id, b.indic_id) as indic_id,
    coalesce(a.zone_id, b.zone_id) as zone_id,
    coalesce(a.metric_date, b.metric_date) as metric_date,
    coalesce(a.metric_type, b.metric_type) as metric_type,
    a.metric_value as computed_value,
    b.metric_value as illegal_input_value
from source a full join
mesure_last_params_nat_all_vc b on a.indic_id=b.indic_id and a.zone_id=b.zone_id and a.metric_date=b.metric_date and a.metric_type=b.metric_type
),
-- Jointure des valeurs précédentes
--	et de valeurs illegalement saisies en vi
join_correct_and_illegal_values_vi as (
select 
    coalesce(a.indic_id, b.indic_id) as indic_id,
    coalesce(a.zone_id, b.zone_id) as zone_id,
    coalesce(a.metric_date, b.metric_date) as metric_date,
    coalesce(a.metric_type, b.metric_type) as metric_type,
    a.metric_value as computed_value,
    b.metric_value as illegal_input_value
from source a full join
mesure_last_params_nat_all_vi b on a.indic_id=b.indic_id and a.zone_id=b.zone_id and a.metric_date=b.metric_date and a.metric_type=b.metric_type
)

-- Jointure des VC+VI avec le reste des valeurs NAT aggrégées (VA)
select * from 
(select 
    indic_id, zone_id, metric_date, metric_type,
	-- Si pas de computed_value, alors on prend la illegal_value
	coalesce(computed_value, illegal_input_value::float) as metric_value 
    from join_correct_and_illegal_values_vc where metric_type='vc') as a
union
(select 
    indic_id, zone_id, metric_date, metric_type,
	-- Si pas de computed_value, alors on prend la illegal_value
	coalesce(computed_value, illegal_input_value::float) as metric_value 
    from join_correct_and_illegal_values_vi where metric_type='vi')
union
(select 
    indic_id, zone_id, metric_date, metric_type, metric_value 
    from {{ ref('agg_nat') }}  where metric_type='va')



