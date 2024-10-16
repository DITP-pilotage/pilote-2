-- Compute unbounded TA
with 
get_unbounded_ta_hausse as
(
	select a.*,
	{{ compute_ta_hausse_macro('vig', 'vca_courant', 'vaca') }} as unbounded_taa_courant,
	{{ compute_ta_hausse_macro('vig', 'vca_adate', 'vaca') }} as unbounded_taa_adate,
	{{ compute_ta_hausse_macro('vig', 'vcg', 'vacg') }} as unbounded_tag,
	{{ compute_ta_hausse_macro('vig', 'vcg', 'vacp') }} as unbounded_tap_global,
	{{ compute_ta_hausse_macro('vig', 'vca_courant', 'vacp') }} as unbounded_tap_courant
	from {{ ref('merge_computed_values') }} a
	right join (select * from {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} where tendance in ('HAUSSE', 'STABLE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta_baisse as
(
	select a.*,
	{{ compute_ta_baisse_macro('vig', 'vca_courant', 'vaca') }} as unbounded_taa_courant,
	{{ compute_ta_hausse_macro('vig', 'vca_adate', 'vaca') }} as unbounded_taa_adate,
	{{ compute_ta_baisse_macro('vig', 'vcg', 'vacg') }} as unbounded_tag,
	{{ compute_ta_baisse_macro('vig', 'vcg', 'vacp') }} as unbounded_tap_global,
	{{ compute_ta_baisse_macro('vig', 'vca_courant', 'vacp') }} as unbounded_tap_courant
	from {{ ref('merge_computed_values') }} a
	right join (select * from {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} where tendance in ('BAISSE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta as (
	select * from get_unbounded_ta_hausse a union (select * from get_unbounded_ta_baisse)
),
-- Compute bounded TA
get_bounded_ta as (
	select *,
    case when unbounded_taa_courant is null then null else greatest(least(unbounded_taa_courant, 100), 0)::numeric end as taa_courant,
    case when unbounded_taa_adate is null then null else greatest(least(unbounded_taa_adate, 100), 0)::numeric end as taa_adate,
    case when unbounded_tag is null then null else greatest(least(unbounded_tag, 100), 0)::numeric end as tag,
	case when unbounded_tap_global is null then null else greatest(least(unbounded_tap_global, 100), 0)::numeric end as tap_global,
	case when unbounded_tap_courant is null then null else greatest(least(unbounded_tap_courant, 100), 0)::numeric end as tap_courant
	from get_unbounded_ta
)

select * from get_bounded_ta
