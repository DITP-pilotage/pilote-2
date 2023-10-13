-- Pour obtenir la VIG et sa date pour chaque indicateur


with 
-- on trie les vi NON NULL par date croissante
vi_non_null_sorted as (
	select indic_id, zone_id, metric_date, vi,
	rank() over (partition by indic_id, zone_id order by metric_date asc) as r
	from {{ ref('pivot_mesures') }}
	-- vi NON NULL
	where vi is not null and
	-- vig_min_date: aucune VI globale ne pourra être avant cette date
    metric_date::date >= '{{ var('vig_min_date') }}'::date
)


select indic_id , zone_id , metric_date as vig_date, vi as vig
from vi_non_null_sorted
where r=1

