{{ config(materialized='table') }}

with 
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic as (
	select 
	b.indic_parent_ch, a.zone_id, z.zone_type as "maille", metric_date,a.indic_id,
	vaca, vig, vca, vcg,
	taa, tag
	from {{ ref('compute_ta_indic') }} a
	left join {{ ref('metadata_indicateurs') }} b on a.indic_id =b.indic_id
	left join {{ ref('metadata_zones') }} z on a.zone_id=z.zone_id 
	order by indic_parent_ch, zone_id, metric_date, indic_id
),
-- Calcul du TA pondéré
--	On va pondérer chaque TA par sa pondération à cette maille
ta_zone_indic_pond as (
select a.*, b.poids_pourcent_dept, b.poids_pourcent_reg, b.poids_pourcent_nat,
	-- Pondération de la zone en question
	case 
		when maille='DEPT' then poids_pourcent_dept
		when maille='REG' then poids_pourcent_reg
		when maille='NAT' then poids_pourcent_nat
	end as poids_pourcent_zone,
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
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente
ta_zone_indic_pond_today as (
select * from (
	select *, rank() over (partition by zone_id, indic_id order by metric_date desc) as r,
	'today' as valid_on
	from ta_zone_indic_pond 
	where vaca is not null) a
where a.r=1
),
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente
--	MAIS en excluant les valeurs du mois courant. Ainsi, on aura le TA en vigeur au mois précédent.
ta_zone_indic_pond_prev_month as (
select * from (
	select *, rank() over (partition by zone_id, indic_id order by metric_date desc) as r,
	'prev_month' as valid_on
	from ta_zone_indic_pond 
	where vaca is not null
	and date_trunc('month', metric_date::date)<date_trunc('month', now()) 
	) a
where a.r=1
),
-- Calcul du TA chantier
ta_ch as (
	select indic_parent_ch as chantier_id, zone_id, valid_on,
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
	-- Calcul du TA par somme des TA pondérés et bornage dans [0,100] (+handle null)
	case 
		when sum(taa_pond) > 100 then 100
		when sum(taa_pond) < 0 then 0
		else sum(taa_pond)
	end as taa_ch,
	case 
		when sum(tag_pond) > 100 then 100
		when sum(tag_pond) < 0 then 0
		else sum(tag_pond)
	end as tag_ch
	from 
	(
	-- On ne considère que les TA dont les indicateurs ont une pondération > 0
	select * from ta_zone_indic_pond_today where poids_pourcent_zone > 0 
	union
	select * from ta_zone_indic_pond_prev_month where poids_pourcent_zone > 0
	) a
	group by indic_parent_ch, zone_id, valid_on
)

select a.*, t.code as territoire_code from ta_ch a
left join {{ source('db_schema_public', 'territoire') }} t on t.zone_id=a.zone_id
