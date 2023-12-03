-- Compute unbounded TA
with get_unbounded_ta as
(
	select a.*,
	-- TAA: Si la VI=VC -> TA = NULL
	case 
		when vig=vca then null 
		when b.tendance='HAUSSE' and vaca>=vca then 100 
		when b.tendance='BAISSE' and vaca<=vca then 100
		else round((100*(vaca-vig)/(vca-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_taa,
	-- TAG: Si la VI=VC-> TA = NULL
	case 
		when vig=vcg then null 
		when b.tendance='HAUSSE' and vacg>=vcg then 100 
		when b.tendance='BAISSE' and vacg<=vcg then 100
		else round((100*(vacg-vig)/(vcg-vig))::numeric, {{ var('ta_decimales') }}) 
	end as unbounded_tag
	from {{ ref('merge_computed_values') }} a
	left join {{ ref('metadata_parametrage_indicateurs') }} b on a.indic_id=b.indic_id
),
-- Compute bounded TA
get_bounded_ta as (
	select *,
    case when unbounded_taa is null then null else greatest(least(unbounded_taa, 100), 0)::numeric end as taa,
    case when unbounded_tag is null then null else greatest(least(unbounded_tag, 100), 0)::numeric end as tag
	from get_unbounded_ta
)

select * from get_bounded_ta