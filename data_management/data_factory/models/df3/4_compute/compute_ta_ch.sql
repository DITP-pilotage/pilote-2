

with 
-- TA de chaque {indic-zone} à chaque date
ta_zone_indic as (
	select 
	b.indic_parent_ch, a.zone_id, z.zone_type as "maille", metric_date,a.indic_id,
	vaca, vig, vca_courant, vcg,
	taa_courant, tag
	from "df3"."compute_ta_indic" a
	left join "raw_data"."metadata_indicateurs" b on a.indic_id =b.indic_id
	left join "raw_data"."metadata_zones" z on a.zone_id=z.zone_id 
	where b.indic_parent_ch like'CH-006' and a.zone_id ='FRANCE' --and a.indic_id ='IND-334'
	order by indic_parent_ch, zone_id, metric_date, indic_id
)


,
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
		when maille='DEPT' then taa_courant*0.01*poids_pourcent_dept
		when maille='REG' then taa_courant*0.01*poids_pourcent_reg
		when maille='NAT' then taa_courant*0.01*poids_pourcent_nat
	end as taa_courant_pond,
	case 
		when maille='DEPT' then tag*0.01*poids_pourcent_dept
		when maille='REG' then tag*0.01*poids_pourcent_reg
		when maille='NAT' then tag*0.01*poids_pourcent_nat
	end as tag_pond
from ta_zone_indic a
left join "raw_data"."metadata_parametrage_indicateurs" b on a.indic_id=b.indic_id 
order by indic_parent_ch, zone_id, metric_date, indic_id
),

-- table qui contient les valeurs qui ne varient pas
base1 as (
select a.indic_parent_ch, a.zone_id, a."maille", a.metric_date, a.indic_id,
	a.vaca, a.vig, a.vca_courant, a.vcg,
	a.taa_courant, a.tag,
	a.poids_pourcent_dept, a.poids_pourcent_reg, a.poids_pourcent_nat,
	a.poids_pourcent_zone, a.taa_courant_pond, a.tag_pond
		from ta_zone_indic_pond a

),
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_today
taa_zone_indic_pond_today as (
select * from (
	select 
	a.indic_parent_ch, a.zone_id, 
	--a."maille", 
	a.metric_date, a.indic_id,
	--a.vaca, a.vig, a.vca_courant, a.vcg,
	--a.taa_courant, a.tag,
	--a.poids_pourcent_dept, a.poids_pourcent_reg, a.poids_pourcent_nat,
	--a.poids_pourcent_zone, 
	a.taa_courant_pond, --null::float as tag_pond,
	rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_taa_courant_today as max_date,
	'today' as valid_on
	from base1 a
	left join "df3"."get_max_date_taa_ch" b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_taa_courant_today::date
	) a
where a.r=1
)



,
-- De meme les TAG
tag_zone_indic_pond_today as (
select * from (
	select 
	a.indic_parent_ch, a.zone_id, 
	--a."maille", 
	a.metric_date, a.indic_id,
	--a.vaca, a.vig, a.vca_courant, a.vcg,
	--a.taa_courant, a.tag,
	--a.poids_pourcent_dept, a.poids_pourcent_reg, a.poids_pourcent_nat,
	--a.poids_pourcent_zone, null::float as taa_courant_pond, 
	a.tag_pond,
	rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_tag_today as max_date,
	'today' as valid_on
	from base1 a
	left join "df3"."get_max_date_tag_ch" b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_tag_today::date
	) a
where a.r=1
)
--select * from taa_zone_indic_pond_today


,
-- Pour chaque indic-zone, on garde la ligne avec une vaca la plus récente avec date<=max_date_taa_courant_previous
taa_zone_indic_pond_prev_month as (
select * from (
	select 
	a.indic_parent_ch, a.zone_id, 
	--a."maille", 
	a.metric_date, a.indic_id,
	--a.vaca, a.vig, a.vca_courant, a.vcg,
	--a.taa_courant, a.tag,
	--a.poids_pourcent_dept, a.poids_pourcent_reg, a.poids_pourcent_nat,
	--a.poids_pourcent_zone, 
	a.taa_courant_pond, --null::float as tag_pond,
	rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_taa_courant_previous as max_date,
	'prev_month' as valid_on
	from ta_zone_indic_pond a
	left join "df3"."get_max_date_taa_ch" b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_taa_courant_previous::date
	) a
where a.r=1
)


,
-- De meme les TAG
tag_zone_indic_pond_prev_month as (
select * from (
	select 
	a.indic_parent_ch, a.zone_id, 
	--a."maille", 
	a.metric_date, a.indic_id,
	--a.vaca, a.vig, a.vca_courant, a.vcg,
	--a.taa_courant, a.tag,
	--a.poids_pourcent_dept, a.poids_pourcent_reg, a.poids_pourcent_nat,
	--a.poids_pourcent_zone, null::float as taa_courant_pond, 
	a.tag_pond,
	rank() over (partition by a.zone_id, a.indic_id order by a.metric_date desc) as r, b.max_date_tag_previous as max_date,
	'prev_month' as valid_on
	from ta_zone_indic_pond a
	left join "df3"."get_max_date_tag_ch" b on a.indic_parent_ch=b.chantier_id and a.zone_id=b.zone_id
	where vaca is not null
	and metric_date::date<=max_date_tag_previous::date
	) a
where a.r=1
),
-- TODO: faire la jointure des derniers TAA et TAG today
ta_zone_indic_pond_today as (
-- Test: must be 1 row/indic-zone mais possible multiple si metric_date du taa et tag est différente
	select a.*, b.max_date as max_date_taa, c.max_date as max_date_tag, 'today' as valid_on from 
	base1 a 
	right join taa_zone_indic_pond_today b on a.indic_parent_ch=b.indic_parent_ch and a.zone_id=b.zone_id and a.metric_date=b.metric_date
	right join tag_zone_indic_pond_today c on a.indic_parent_ch=c.indic_parent_ch and a.zone_id=c.zone_id and a.metric_date=c.metric_date

)
--select * from ta_zone_indic_pond_today where poids_pourcent_zone > 0 
,
-- TODO: de même pour les derniers TAA et TAG prev_month
ta_zone_indic_pond_prev_month as (
	select a.*, b.max_date as max_date_taa, c.max_date as max_date_tag, 'prev_month' as valid_on from 
	base1 a 
	right join taa_zone_indic_pond_prev_month b on a.indic_parent_ch=b.indic_parent_ch and a.zone_id=b.zone_id and a.metric_date=b.metric_date
	right join tag_zone_indic_pond_prev_month c on a.indic_parent_ch=c.indic_parent_ch and a.zone_id=c.zone_id and a.metric_date=c.metric_date
)
--select * from ta_zone_indic_pond_prev_month

,
-- Calcul du TA chantier
ta_ch as (
	select indic_parent_ch as chantier_id, zone_id, valid_on,
	array_agg(indic_id) as indic_ids,
	array_agg(poids_pourcent_dept) as p_dept,
	array_agg(poids_pourcent_reg) as p_reg,
	array_agg(poids_pourcent_nat) as p_nat,
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
	-- On ne considère que les TA dont les indicateurs ont une pondération > 0
	select * from ta_zone_indic_pond_today where poids_pourcent_zone > 0 
	union
	select * from ta_zone_indic_pond_prev_month where poids_pourcent_zone > 0
	) a
	group by indic_parent_ch, zone_id, valid_on
)

--select * from ta_ch

--select * from ta_zone_indic_pond

-- main
select a.*, t.code as territoire_code from ta_ch a left join "public"."territoire" t on t.zone_id=a.zone_id




