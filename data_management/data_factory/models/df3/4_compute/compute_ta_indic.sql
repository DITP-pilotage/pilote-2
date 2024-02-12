-- Compute unbounded TA
with 
get_unbounded_ta_hausse as
(
	select a.*,
	{{ compute_ta_hausse_macro('vig', 'vca', 'vaca') }} as unbounded_taa,
	{{ compute_ta_hausse_macro('vig', 'vca_a_date', 'vaca') }} as unbounded_taa_adate,
	{{ compute_ta_hausse_macro('vig', 'vcg', 'vacg') }} as unbounded_tag
	from {{ ref('merge_computed_values') }} a
	right join (select * from {{ ref('metadata_parametrage_indicateurs') }} where tendance in ('HAUSSE', 'STABLE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta_baisse as
(
	select a.*,
	{{ compute_ta_baisse_macro('vig', 'vca', 'vaca') }} as unbounded_taa,
	{{ compute_ta_hausse_macro('vig', 'vca_a_date', 'vaca') }} as unbounded_taa_adate,
	{{ compute_ta_baisse_macro('vig', 'vcg', 'vacg') }} as unbounded_tag
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
    case when unbounded_taa_adate is null then null else greatest(least(unbounded_taa_adate, 100), 0)::numeric end as taa_adate,
    case when unbounded_tag is null then null else greatest(least(unbounded_tag, 100), 0)::numeric end as tag
	from get_unbounded_ta
)

select * from get_bounded_ta
