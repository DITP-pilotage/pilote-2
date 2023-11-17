{{ config(materialized='table') }}

-- TA de chaque {indic-zone} à chaque date
with ta_zone_indic as (

select 
 b.indic_parent_ch, a.zone_id, z.zone_type as "maille", metric_date,a.indic_id,
 vaca, vig, vca, vcg,
 taa, tag
from {{ ref('compute_ta_indic') }} a
left join {{ ref('metadata_indicateurs') }} b on a.indic_id =b.indic_id
left join {{ ref('metadata_zones') }} z on a.zone_id=z.zone_id 
--where indic_parent_ch='CH-013' and a.zone_id='D05'
--where indic_parent_ch='CH-137' and a.zone_id='D01'
order by indic_parent_ch, zone_id, metric_date, indic_id
),
-- Calcul du TA pondéré
ta_zone_indic_pond as (
select a.*, b.poids_pourcent_dept, b.poids_pourcent_reg, b.poids_pourcent_nat,
	case 
		when maille='DEPT' then taa*0.01*poids_pourcent_dept
		when maille='REG' then taa*0.01*poids_pourcent_reg
		when maille='NAT' then taa*0.01*poids_pourcent_nat
	end as taa_pond,
	case 
		when maille='DEPT' then tag*0.01*poids_pourcent_dept
		when maille='REG' then tag*0.01*poids_pourcent_reg
		when maille='NAT' then tag*0.01*poids_pourcent_nat
	end as tag_pond
from ta_zone_indic a
left join {{ ref('metadata_parametrage_indicateurs') }} b on a.indic_id=b.indic_id 
order by indic_parent_ch, zone_id, metric_date, indic_id

),
ta_zone_indic_lastmonth as (
select * from ta_zone_indic where date_trunc('month', metric_date::date)<date_trunc('month', now()) 
),

compute_ta_pond_today as (
select * from (
	select *, rank() over (partition by zone_id, indic_id order by metric_date desc) as r,
	'today' as valid_on
	from ta_zone_indic_pond 
	-- pour ne pas sélectionner les VC
	where vaca is not null) a
where a.r=1
--and date_trunc('month', metric_date::date)<date_trunc('month', now()) 
),
compute_ta_pond_prev_month as (
select * from (
	select *, rank() over (partition by zone_id, indic_id order by metric_date desc) as r,
	'prev_month' as valid_on
	from ta_zone_indic_pond 
	-- pour ne pas sélectionner les VC
	where vaca is not null
	and date_trunc('month', metric_date::date)<date_trunc('month', now()) 
	) a
where a.r=1
),

ta_ch as (
	select indic_parent_ch as chantier_id, zone_id, valid_on,
	--date_trunc('month', metric_date::date) as mmonth,
	array_agg(indic_id) as indic_ids,
	array_agg(poids_pourcent_dept) as p_dept,
	array_agg(poids_pourcent_reg) as p_reg,
	array_agg(poids_pourcent_nat) as p_nat,
	array_agg(vaca) as vaca_agg, 
	array_agg(vig) as vig_agg, 
	array_agg(vca) as vca_agg, 
	array_agg(vcg) as vcg_agg, 
	array_agg(taa) as taa_agg, 
	array_agg(taa_pond) as taa_pond_agg, 
	array_agg(tag) as tag_agg,
	array_agg(tag_pond) as tag_pond_agg,
	sum(taa_pond) as taa_ch,
	sum(tag_pond) as tag_ch
	from 
	(
	select * from compute_ta_pond_today union
	select * from compute_ta_pond_prev_month
	) a
	--group by indic_parent_ch, zone_id, date_trunc('month', metric_date::date)
	group by indic_parent_ch, zone_id, valid_on
)

select a.*, t.code as territoire_code from ta_ch a
left join {{ source('db_schema_public', 'territoire') }} t on t.zone_id=a.zone_id
