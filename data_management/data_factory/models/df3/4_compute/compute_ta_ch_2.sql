
-- TA de chaque {indic-zone} à chaque date
with ta_zone_indic as (

select 
 b.indic_parent_ch, a.zone_id, z.zone_type as "maille", metric_date,a.indic_id,
 vaca, vig, vca, vcg,
 taa, tag
from df3.compute_ta_indic a
left join raw_data.metadata_indicateurs b on a.indic_id =b.indic_id
left join raw_data.metadata_zones z on a.zone_id=z.zone_id 
--where indic_parent_ch='CH-013' and a.zone_id='D05'
where a.indic_id='IND-776' and a.zone_id='FRANCE'
order by indic_parent_ch, zone_id, metric_date, indic_id
),
-- Calcul du TA pondéré
compute_ta_pond as (
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
left join raw_data.metadata_parametrage_indicateurs b on a.indic_id=b.indic_id 
order by indic_parent_ch, zone_id, metric_date, indic_id

),
-- On a le TA a chaque date
taa_toutes_dates as (
select indic_parent_ch, zone_id, 
--date_trunc('month', metric_date::date) as mmonth,
metric_date,
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
from compute_ta_pond
--group by indic_parent_ch, zone_id, date_trunc('month', metric_date::date)
group by indic_parent_ch, zone_id, metric_date
)


select * from taa_toutes_dates
