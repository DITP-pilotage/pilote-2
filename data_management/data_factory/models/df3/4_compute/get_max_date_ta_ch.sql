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

select chantier_id, zone_id, ta_type,
    -- on prend la date où r==1
    MAX(metric_date) FILTER (WHERE r=1) AS max_date_ta_today,
    -- on prend la date où r==2
    MAX(metric_date) FILTER (WHERE r=2) AS max_date_ta_previous
from rank_dates_ta_ch_dispo
group by chantier_id, zone_id, ta_type


