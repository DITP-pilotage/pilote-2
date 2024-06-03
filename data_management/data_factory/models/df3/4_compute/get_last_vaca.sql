-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VACA
with 
sort_mesures_vaca as (
	select *,
	rank() over (partition by indic_id, zone_id order by metric_date desc) as r
	from {{ ref('compute_ta_indic') }}
	where vaca is not null),
sort_mesures_vaca_last as (
	select * from sort_mesures_vaca where r=1
)

SELECT 
indic_id, zone_id, 
metric_date as date_valeur_actuelle,
vaca, tag, taa_courant
FROM sort_mesures_vaca_last
