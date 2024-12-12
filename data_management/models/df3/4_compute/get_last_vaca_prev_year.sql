-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VACA de l'an dernier
with 
sort_mesures_vaca_prev_year as (
	select *,
	rank() over (partition by indic_id, zone_id order by metric_date desc) as r
	from {{ ref('compute_ta_indic') }}
	where vaca is not null
	-- la date de la valeur est dans l'année dernière
	and metric_date::date < date_trunc('year', now())
	),
sort_mesures_vaca_prev_year_last as (
	select * from sort_mesures_vaca_prev_year where r=1
)

SELECT 
	indic_id,
	zone_id, 
	metric_date as date_valeur_actuelle,
	vaca,
	tag,
	taa_courant,
	vca_adate,
	vca_adate_date,
	taa_adate,
	vacp,
	tap_global,
	tap_courant
FROM sort_mesures_vaca_prev_year_last
