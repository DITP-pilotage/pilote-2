WITH
-- Pour chaque indicateur-zone, on choisit la ligne de la dernière VACA
sort_mesures_vaca as (
	select *,
	rank() over (partition by indic_id, zone_id order by metric_date desc) as r
	from {{ ref('compute_ta_indic') }}
	where vaca is not null),
-- Et on retourne celle avec la metric_date la plus récente
sort_mesures_vaca_last as (
	select * from sort_mesures_vaca where r=1
)

select * from sort_mesures_vaca_last
