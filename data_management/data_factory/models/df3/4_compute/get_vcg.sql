-- Pour obtenir la VCG et sa date pour chaque indicateur


with 
-- on trie les vc NON NULL par date DEcroissante
vc_non_null_sorted as (
	select indic_id, zone_id, metric_date, vc,
	rank() over (partition by indic_id, zone_id order by metric_date DESC) as r
	from {{ ref('pivot_mesures') }}
	-- vc NON NULL
	where vc is not null and 
	-- vcg_max_date: aucune VC globale ne pourra dépasser cette date
	metric_date::date <= '{{ var('vcg_max_date') }}'::date
)

select 
indic_id , zone_id , metric_date as vcg_date, vc as vcg
from vc_non_null_sorted 
where r=1

