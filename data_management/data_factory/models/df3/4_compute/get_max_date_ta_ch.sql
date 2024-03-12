-- cf doc dbt

with 
-- Tous les TAA_courant non vides
indic_taa_courant_dispo as (
	select b.chantier_id, indic_id, zone_id, metric_date, taa_courant as ta, 'taa_courant' as ta_type
	from {{ ref('compute_ta_indic') }} a
	left join {{ ref('stg_ppg_metadata__indicateurs') }} b on a.indic_id=b.id
	where taa_courant is not null
),
-- Tous les TAG non vides
indic_tag_dispo as (
	select b.chantier_id, indic_id, zone_id, metric_date, tag as ta, 'tag' as ta_type
	from {{ ref('compute_ta_indic') }} a
	left join {{ ref('stg_ppg_metadata__indicateurs') }} b on a.indic_id=b.id
	where tag is not null
)
-- Merge des TAA_courant et TAG non vides
, indic_ta_courant_dispo as (
	select * from indic_taa_courant_dispo
	union select * from indic_tag_dispo
)

, ch_count_ta_par_date as (
select 
	chantier_id, zone_id, metric_date, count(indic_id) as n_taa_dispos, ta_type
from indic_ta_courant_dispo 
group by chantier_id, zone_id, metric_date, ta_type
order by chantier_id, zone_id, metric_date desc
)

, rank_dates_ta_ch_dispo as (
select 
	*,
	rank() over (partition by chantier_id, zone_id, ta_type order by metric_date desc) as r
from ch_count_ta_par_date
)

, inter as (select *,
case 
	when r=1 then 'today'
	when r=2 then 'prev_month'
end as valid_on,
case when ta_type='taa_courant' then metric_date else null end as max_date_taa_courant,
case When ta_type='tag' then metric_date else null end as max_date_tag
from rank_dates_ta_ch_dispo)

--select * from inter

select
	chantier_id, zone_id, valid_on, 
	max(max_date_taa_courant) as max_date_taa_courant,
	max(max_date_tag) as max_date_tag
from inter where valid_on in ('today', 'prev_month')
group by chantier_id, zone_id, valid_on


