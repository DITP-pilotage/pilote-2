-- Compute unbounded TA
with get_unbounded_ta as
(
	select *,
	-- TAA: Si la VI=VC -> TA = NULL
	case when vig=vca then null else round((100*(vaca-vig)/(vca-vig))::numeric, {{ var('ta_decimales') }}) end as unbounded_taa,
	-- TAG: Si la VI=VC-> TA = NULL
	case when vig=vcg then null else round((100*(vacg-vig)/(vcg-vig))::numeric, {{ var('ta_decimales') }}) end as unbounded_tag
	from {{ ref('merge_computed_values') }}
),
-- Compute bounded TA
get_bounded_ta as (
	select *,
    case when unbounded_taa is null then null else greatest(least(unbounded_taa, 100), 0)::numeric end as taa,
    case when unbounded_tag is null then null else greatest(least(unbounded_tag, 100), 0)::numeric end as tag
	from get_unbounded_ta
)

select * from get_bounded_ta