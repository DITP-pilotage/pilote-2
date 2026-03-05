-- Compute unbounded TA
with 
get_unbounded_ta_hausse as
(
	select a.*,
	

case 
    -- VI>=VC
    WHEN vig>=vca_courant AND vaca >= vca_courant THEN 100
    WHEN vig>=vca_courant AND vaca < vca_courant THEN 0
    -- else
    else round((100*(vaca-vig)/(vca_courant-vig))::numeric, 2) 
end

 as unbounded_taa_courant,
	

case 
    -- VI>=VC
    WHEN vig>=vca_adate AND vaca >= vca_adate THEN 100
    WHEN vig>=vca_adate AND vaca < vca_adate THEN 0
    -- else
    else round((100*(vaca-vig)/(vca_adate-vig))::numeric, 2) 
end

 as unbounded_taa_adate,
	

case 
    -- VI>=VC
    WHEN vig>=vcg AND vacg >= vcg THEN 100
    WHEN vig>=vcg AND vacg < vcg THEN 0
    -- else
    else round((100*(vacg-vig)/(vcg-vig))::numeric, 2) 
end

 as unbounded_tag,
	

case 
    -- VI>=VC
    WHEN vig>=vcg AND vacp >= vcg THEN 100
    WHEN vig>=vcg AND vacp < vcg THEN 0
    -- else
    else round((100*(vacp-vig)/(vcg-vig))::numeric, 2) 
end

 as unbounded_tap_global,
	

case 
    -- VI>=VC
    WHEN vig>=vca_courant AND vacp >= vca_courant THEN 100
    WHEN vig>=vca_courant AND vacp < vca_courant THEN 0
    -- else
    else round((100*(vacp-vig)/(vca_courant-vig))::numeric, 2) 
end

 as unbounded_tap_courant,
	

case 
    -- VI>=VC
    WHEN vig>=vca_adate AND vacp >= vca_adate THEN 100
    WHEN vig>=vca_adate AND vacp < vca_adate THEN 0
    -- else
    else round((100*(vacp-vig)/(vca_adate-vig))::numeric, 2) 
end

 as unbounded_tap_adate
	from "dev_pilote__6230"."df3"."merge_computed_values" a
	right join (select * from "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" where tendance in ('HAUSSE', 'STABLE')) b on a.indic_id=b.indic_id
),
get_unbounded_ta_baisse as
(
	select a.*,
	

case 
    -- VI<=VC
    WHEN vig<=vca_courant AND vaca <= vca_courant THEN 100
    WHEN vig<=vca_courant AND vaca > vca_courant THEN 0
    -- else
    else round((100*(vaca-vig)/(vca_courant-vig))::numeric, 2) 
end

 as unbounded_taa_courant,
	

case 
    -- VI<=VC
    WHEN vig<=vca_adate AND vaca <= vca_adate THEN 100
    WHEN vig<=vca_adate AND vaca > vca_adate THEN 0
    -- else
    else round((100*(vaca-vig)/(vca_adate-vig))::numeric, 2) 
end

 as unbounded_taa_adate,
	

case 
    -- VI<=VC
    WHEN vig<=vcg AND vacg <= vcg THEN 100
    WHEN vig<=vcg AND vacg > vcg THEN 0
    -- else
    else round((100*(vacg-vig)/(vcg-vig))::numeric, 2) 
end

 as unbounded_tag,
	

case 
    -- VI<=VC
    WHEN vig<=vcg AND vacp <= vcg THEN 100
    WHEN vig<=vcg AND vacp > vcg THEN 0
    -- else
    else round((100*(vacp-vig)/(vcg-vig))::numeric, 2) 
end

 as unbounded_tap_global,
	

case 
    -- VI<=VC
    WHEN vig<=vca_courant AND vacp <= vca_courant THEN 100
    WHEN vig<=vca_courant AND vacp > vca_courant THEN 0
    -- else
    else round((100*(vacp-vig)/(vca_courant-vig))::numeric, 2) 
end

 as unbounded_tap_courant,
	

case 
    -- VI<=VC
    WHEN vig<=vca_adate AND vacp <= vca_adate THEN 100
    WHEN vig<=vca_adate AND vacp > vca_adate THEN 0
    -- else
    else round((100*(vacp-vig)/(vca_adate-vig))::numeric, 2) 
end

 as unbounded_tap_adate
	from "dev_pilote__6230"."df3"."merge_computed_values" a
	right join (select * from "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" where tendance in ('BAISSE')) b on a.indic_id=b.indic_id
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
	case when unbounded_tap_courant is null then null else greatest(least(unbounded_tap_courant, 100), 0)::numeric end as tap_courant,
	case when unbounded_tap_adate is null then null else greatest(least(unbounded_tap_adate, 100), 0)::numeric end as tap_adate
	from get_unbounded_ta
)

select * from get_bounded_ta