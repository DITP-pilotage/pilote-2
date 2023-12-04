-- Compute unbounded TA
with 
get_unbounded_ta_hausse as
(
	select a.*,
	case 
		-- VI>=VC
		WHEN vig>=vca AND vaca >= vca THEN 100
		WHEN vig>=vca AND vaca < vca THEN 0
		-- else
		else round((100*(vaca-vig)/(vca-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_taa,
	case 
		-- VI>=VC
		WHEN vig>=vcg AND vacg >= vcg THEN 100
		WHEN vig>=vcg AND vacg < vcg THEN 0
		else round((100*(vacg-vig)/(vcg-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_tag
	from {{ ref('merge_computed_values') }} a
	right join (select * from {{ ref('metadata_parametrage_indicateurs') }} where tendance in ('HAUSSE', 'STABLE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta_baisse as
(
	select a.*,
	case 
		-- VI<=VC
		WHEN vig<=vca AND vaca <= vca THEN 100
		WHEN vig<=vca AND vaca > vca THEN 0
		-- else
		else round((100*(vaca-vig)/(vca-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_taa,
	case 
		-- VI<=VC
		WHEN vig<=vcg AND vacg <= vcg THEN 100
		WHEN vig<=vcg AND vacg > vcg THEN 0
		-- else
		else round((100*(vacg-vig)/(vcg-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_tag
	from {{ ref('merge_computed_values') }} a
	right join (select * from {{ ref('metadata_parametrage_indicateurs') }} where tendance in ('BAISSE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta as (
	select * from get_unbounded_ta_hausse a union (select * from get_unbounded_ta_baisse)
),
-- Compute bounded TA
get_bounded_ta as (
	select *,
    case when unbounded_taa is null then null else greatest(least(unbounded_taa, 100), 0)::numeric end as taa,
    case when unbounded_tag is null then null else greatest(least(unbounded_tag, 100), 0)::numeric end as tag
	from get_unbounded_ta
)

select * from get_bounded_ta