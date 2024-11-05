-- cf doc dbt

with 
indic_taa_courant_dispo as (
	select b.chantier_id, indic_id, zone_id, metric_date, taa_courant
	from {{ ref('compute_ta_indic') }} a
	left join {{ ref('stg_ppg_metadata__indicateurs') }} b on a.indic_id=b.id
	where vaca is not null
)
, ch_count_taa_courant_par_date as (
select 
	chantier_id, zone_id, metric_date, count(indic_id) as n_taa_dispos
from indic_taa_courant_dispo 
group by chantier_id, zone_id, metric_date
order by chantier_id, zone_id, metric_date desc
)

, rank_dates_taa_ch_dispo as (
select 
	*,
	rank() over (partition by chantier_id, zone_id order by metric_date desc) as r
from ch_count_taa_courant_par_date
)

select chantier_id, zone_id, 
    -- on prend la date où r==1
    MAX(metric_date) FILTER (WHERE r=1) AS max_date_taa_courant_today,
    -- on prend la date où r==2
    MAX(metric_date) FILTER (WHERE r=2) AS max_date_taa_courant_previous
from rank_dates_taa_ch_dispo
group by chantier_id, zone_id

