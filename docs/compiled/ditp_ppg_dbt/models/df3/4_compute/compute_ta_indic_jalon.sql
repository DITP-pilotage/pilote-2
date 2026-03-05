


WITH get_val_jalons AS (
    SELECT
        meta_indic.id as indic_id,
        zones.id as zone_id,
        jalons.jalon,
        a.vaca,
        a.date_vaca,
        g.vacg,
        g.date_vacg,
        e.vig,
        e.vig_date,
        f.vca,
        f.vca_date,
        h.vcg,
        h.vcg_date,
        prop.valeur_avancement_proposee as vacp,
        prop.date_valeur_avancement as date_valeur_proposition
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
    CROSS JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS meta_indic
    CROSS JOIN "dev_pilote__6230"."df3"."jalons_a_etudier" as jalons
    LEFT JOIN "dev_pilote__6230"."df3"."get_last_vaca_jalon" AS a
        ON
            meta_indic.id = a.indic_id
            AND zones.id = a.zone_id
            AND jalons.jalon = a.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_last_vacg_jalon" AS g
        ON
            meta_indic.id = g.indic_id
            AND zones.id = g.zone_id
            AND jalons.jalon = g.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vig" AS e
        ON meta_indic.id = e.indic_id AND zones.id = e.zone_id
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vca_jalon" AS f
        ON
            meta_indic.id = f.indic_id
            AND zones.id = f.zone_id
            AND jalons.jalon = f.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vcg" AS h
        ON meta_indic.id = h.indic_id AND zones.id = h.zone_id
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_propositions_valeurs" AS prop
        ON
            meta_indic.id = prop.indic_id
            AND zones.id = prop.zone_id
            AND jalons.jalon >= EXTRACT(YEAR FROM prop.date_valeur_avancement) 

),

get_unbounded_ta AS (
    SELECT
        a.*,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN 

case 
    -- VI>=VC
    WHEN vig>=vca AND vaca >= vca THEN 100
    WHEN vig>=vca AND vaca < vca THEN 0
    -- else
    else round((100*(vaca-vig)/(vca-vig))::numeric, 2) 
end


            WHEN
                b.tendance IN ('BAISSE')
                THEN 

case 
    -- VI<=VC
    WHEN vig<=vca AND vaca <= vca THEN 100
    WHEN vig<=vca AND vaca > vca THEN 0
    -- else
    else round((100*(vaca-vig)/(vca-vig))::numeric, 2) 
end


        END AS unbounded_taa,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN 

case 
    -- VI>=VC
    WHEN vig>=vca AND vacp >= vca THEN 100
    WHEN vig>=vca AND vacp < vca THEN 0
    -- else
    else round((100*(vacp-vig)/(vca-vig))::numeric, 2) 
end


            WHEN
                b.tendance IN ('BAISSE')
                THEN 

case 
    -- VI<=VC
    WHEN vig<=vca AND vacp <= vca THEN 100
    WHEN vig<=vca AND vacp > vca THEN 0
    -- else
    else round((100*(vacp-vig)/(vca-vig))::numeric, 2) 
end


        END AS unbounded_taa_proposition,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN 

case 
    -- VI>=VC
    WHEN vig>=vcg AND vacg >= vcg THEN 100
    WHEN vig>=vcg AND vacg < vcg THEN 0
    -- else
    else round((100*(vacg-vig)/(vcg-vig))::numeric, 2) 
end


            WHEN
                b.tendance IN ('BAISSE')
                THEN 

case 
    -- VI<=VC
    WHEN vig<=vcg AND vacg <= vcg THEN 100
    WHEN vig<=vcg AND vacg > vcg THEN 0
    -- else
    else round((100*(vacg-vig)/(vcg-vig))::numeric, 2) 
end


        END AS unbounded_tag,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN 

case 
    -- VI>=VC
    WHEN vig>=vcg AND vacp >= vcg THEN 100
    WHEN vig>=vcg AND vacp < vcg THEN 0
    -- else
    else round((100*(vacp-vig)/(vcg-vig))::numeric, 2) 
end


            WHEN
                b.tendance IN ('BAISSE')
                THEN 

case 
    -- VI<=VC
    WHEN vig<=vcg AND vacp <= vcg THEN 100
    WHEN vig<=vcg AND vacp > vcg THEN 0
    -- else
    else round((100*(vacp-vig)/(vcg-vig))::numeric, 2) 
end


        END AS unbounded_tag_proposition
    FROM get_val_jalons AS a
    RIGHT JOIN
        "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" AS b
        ON a.indic_id = b.indic_id
),

-- Compute bounded TA
get_bounded_ta AS (
    SELECT
        *,
        CASE
            WHEN unbounded_taa IS null THEN null
            ELSE greatest(least(unbounded_taa, 100), 0)::numeric
        END AS taa,
        CASE
            WHEN unbounded_taa_proposition IS null THEN null
            ELSE greatest(
                least(
                    unbounded_taa_proposition,
                    100
                ),
                0
            )::numeric
        END AS taa_proposition,
        CASE
            WHEN unbounded_tag IS null THEN null
            ELSE greatest(least(unbounded_tag, 100), 0)::numeric
        END AS tag,
        CASE
            WHEN unbounded_tag_proposition IS null THEN null
            ELSE greatest(
                least(
                    unbounded_tag_proposition,
                    100
                ),
                0
            )::numeric
        END AS tag_proposition
    FROM get_unbounded_ta
)

SELECT * FROM get_bounded_ta