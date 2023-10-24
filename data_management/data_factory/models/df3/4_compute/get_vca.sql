-- Pour obtenir les VCA et leur date respective pour chaque indicateur


with 
-- on trie les vc NON NULL par date DEcroissante
vca_non_null_sorted as (
	select indic_id, zone_id, metric_date, vc, date_part('year', metric_date::date) as yyear,
	rank() over (partition by indic_id, zone_id, date_part('year', metric_date::date) order by metric_date DESC) as r
	from {{ ref('pivot_mesures') }}
	-- vc NON NULL
	where vc is not null 
)


select 
indic_id , zone_id , metric_date as vca_date, yyear, vc as vca
from vca_non_null_sorted 
where r=1










