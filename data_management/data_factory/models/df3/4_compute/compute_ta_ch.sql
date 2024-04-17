{{ config(materialized='table') }}

with 
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic as (
	select 
	b.indic_parent_ch, a.zone_id, z.zone_type as "maille", metric_date,a.indic_id,
	vaca, vig, vca_courant, vcg,
	taa_courant, tag
	from {{ ref('compute_ta_indic') }} a
	left join {{ ref('metadata_indicateurs') }} b on a.indic_id =b.indic_id
	left join {{ ref('metadata_zones') }} z on a.zone_id=z.zone_id 
	order by indic_parent_ch, zone_id, metric_date, indic_id
),
-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond as (
select a.*,
	b.poids_zone_reel,
	taa_courant*0.01*b.poids_zone_reel as taa_courant_pond,
	tag*0.01*b.poids_zone_reel as tag_pond
from ta_zone_indic a
left join {{ ref('int_ponderation_reelle') }} b on a.indic_id=b.indic_id and a.zone_id=b.zone_id
order by indic_parent_ch, zone_id, metric_date, indic_id
),
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_today
ta_zone_indic_pond_today as (
select * from (
	select a.*, rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_taa_courant_today as max_date,
	'today' as valid_on
	from ta_zone_indic_pond a
	left join {{ ref('get_max_date_vaca_ch') }} b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_taa_courant_today::date
	) a
where a.r=1
),
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_previous
ta_zone_indic_pond_prev_month as (
select * from (
	select a.*, rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_taa_courant_previous as max_date,
	'prev_month' as valid_on
	from ta_zone_indic_pond a
	left join {{ ref('get_max_date_vaca_ch') }} b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_taa_courant_previous::date
	) a
where a.r=1
),
-- Calcul du TA chantier
ta_ch as (
	select indic_parent_ch as chantier_id, zone_id, valid_on,
	array_agg(indic_id) as indic_ids,
	array_agg(poids_zone_reel) as p_zone_reel,
	array_agg(vaca) as vaca_agg, 
	array_agg(vig) as vig_agg, 
	array_agg(vca_courant) as vca_courant_agg, 
	array_agg(vcg) as vcg_agg, 
	array_agg(taa_courant) as taa_courant_agg, 
	array_agg(taa_courant_pond) as taa_courant_pond_agg, 
	array_agg(tag) as tag_agg,
	array_agg(tag_pond) as tag_pond_agg,
	-- Calcul du TA par somme des TA pondérés et bornage dans [0,100] (+handle null)
	case 
		when bool_or(taa_courant_pond is null) then null
		when sum(taa_courant_pond) > 100 then 100
		when sum(taa_courant_pond) < 0 then 0
		else sum(taa_courant_pond)
	end as taa_courant_ch,
	case 
		when bool_or(tag_pond is null) then null
		when sum(tag_pond) > 100 then 100
		when sum(tag_pond) < 0 then 0
		else sum(tag_pond)
	end as tag_ch
	from 
	(
	-- On ne considère que les TA dont les indicateurs ont une pondération réelle > 0
	-- 	pour le calcul du TA chantier (ie la somme des TA indicateurs pondérés)
	select * from ta_zone_indic_pond_today where poids_zone_reel > 0 
	union
	select * from ta_zone_indic_pond_prev_month where poids_zone_reel > 0
	) a
	group by indic_parent_ch, zone_id, valid_on
)

select a.*, t.code as territoire_code from ta_ch a
left join {{ source('db_schema_public', 'territoire') }} t on t.zone_id=a.zone_id
