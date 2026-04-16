


WITH get_val_jalons AS (
    SELECT
        meta_indic.id AS indic_id,
        zones.id AS zone_id,
        jalons.jalon,
        last_vaca_jalon.vaca,
        last_vaca_jalon.date_vaca,
        last_vacg_jalon.vacg,
        last_vacg_jalon.date_vacg,
        get_vig.vig,
        get_vig.vig_date,
        vca_jalon.vca,
        vca_jalon.vca_date,
        get_vcg.vcg,
        get_vcg.vcg_date,
        prop.valeur_avancement_proposee AS vacp,
        prop.date_valeur_avancement AS date_valeur_proposition
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
    CROSS JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS meta_indic
    CROSS JOIN "dev_pilote__6230"."df3"."jalons_a_etudier" AS jalons
    LEFT JOIN "dev_pilote__6230"."df3"."get_last_vaca_jalon" AS last_vaca_jalon
        ON
            meta_indic.id = last_vaca_jalon.indic_id
            AND zones.id = last_vaca_jalon.zone_id
            AND jalons.jalon = last_vaca_jalon.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_last_vacg_jalon" AS last_vacg_jalon
        ON
            meta_indic.id = last_vacg_jalon.indic_id
            AND zones.id = last_vacg_jalon.zone_id
            AND jalons.jalon = last_vacg_jalon.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vig" AS get_vig
        ON meta_indic.id = get_vig.indic_id AND zones.id = get_vig.zone_id
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vca_jalon" AS vca_jalon
        ON
            meta_indic.id = vca_jalon.indic_id
            AND zones.id = vca_jalon.zone_id
            AND jalons.jalon = vca_jalon.jalon
    LEFT JOIN
        "dev_pilote__6230"."df3"."get_vcg" AS get_vcg
        ON meta_indic.id = get_vcg.indic_id AND zones.id = get_vcg.zone_id
    LEFT JOIN
        "dev_pilote__6230"."marts"."int_propositions_valeurs" AS prop
        ON
            meta_indic.id = prop.indic_id
            AND zones.id = prop.zone_id
            AND jalons.jalon >= EXTRACT(YEAR FROM prop.date_valeur_avancement)

),

get_unbounded_ta AS (
    SELECT
        computed_values_jalon.*,
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig >= computed_values_jalon.vca AND computed_values_jalon.vaca >= computed_values_jalon.vca
                    THEN 100
                WHEN computed_values_jalon.vig >= computed_values_jalon.vca AND computed_values_jalon.vaca < computed_values_jalon.vca
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vaca - computed_values_jalon.vig) / (computed_values_jalon.vca - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig <= computed_values_jalon.vca AND computed_values_jalon.vaca <= computed_values_jalon.vca
                    THEN 100
                WHEN computed_values_jalon.vig <= computed_values_jalon.vca AND computed_values_jalon.vaca > computed_values_jalon.vca
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vaca - computed_values_jalon.vig) / (computed_values_jalon.vca - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_taa, -- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig >= computed_values_jalon.vca AND computed_values_jalon.vacp >= computed_values_jalon.vca
                    THEN 100
                WHEN computed_values_jalon.vig >= computed_values_jalon.vca AND computed_values_jalon.vacp < computed_values_jalon.vca
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacp - computed_values_jalon.vig) / (computed_values_jalon.vca - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig <= computed_values_jalon.vca AND computed_values_jalon.vacp <= computed_values_jalon.vca
                    THEN 100
                WHEN computed_values_jalon.vig <= computed_values_jalon.vca AND computed_values_jalon.vacp > computed_values_jalon.vca
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacp - computed_values_jalon.vig) / (computed_values_jalon.vca - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_taa_proposition, -- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig >= computed_values_jalon.vcg AND computed_values_jalon.vacg >= computed_values_jalon.vcg
                    THEN 100
                WHEN computed_values_jalon.vig >= computed_values_jalon.vcg AND computed_values_jalon.vacg < computed_values_jalon.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacg - computed_values_jalon.vig) / (computed_values_jalon.vcg - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig <= computed_values_jalon.vcg AND computed_values_jalon.vacg <= computed_values_jalon.vcg
                    THEN 100
                WHEN computed_values_jalon.vig <= computed_values_jalon.vcg AND computed_values_jalon.vacg > computed_values_jalon.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacg - computed_values_jalon.vig) / (computed_values_jalon.vcg - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tag, -- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig >= computed_values_jalon.vcg AND computed_values_jalon.vacp >= computed_values_jalon.vcg
                    THEN 100
                WHEN computed_values_jalon.vig >= computed_values_jalon.vcg AND computed_values_jalon.vacp < computed_values_jalon.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacp - computed_values_jalon.vig) / (computed_values_jalon.vcg - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values_jalon.vig <= computed_values_jalon.vcg AND computed_values_jalon.vacp <= computed_values_jalon.vcg
                    THEN 100
                WHEN computed_values_jalon.vig <= computed_values_jalon.vcg AND computed_values_jalon.vacp > computed_values_jalon.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values_jalon.vacp - computed_values_jalon.vig) / (computed_values_jalon.vcg - computed_values_jalon.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tag_proposition -- noqa: LT05
    FROM get_val_jalons AS computed_values_jalon
    LEFT OUTER JOIN
        "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" -- noqa: LT05
            AS parametre_indic
        ON computed_values_jalon.indic_id = parametre_indic.indic_id
    WHERE parametre_indic.tendance IS NOT NULL
),

-- Compute bounded TA
get_bounded_ta AS (
    SELECT
        *,
        CASE
            WHEN unbounded_taa IS NULL THEN NULL
            ELSE GREATEST(LEAST(unbounded_taa, 100), 0)::NUMERIC
        END AS taa,
        CASE
            WHEN unbounded_taa_proposition IS NULL THEN NULL
            ELSE GREATEST(
                LEAST(
                    unbounded_taa_proposition,
                    100
                ),
                0
            )::NUMERIC
        END AS taa_proposition,
        CASE
            WHEN unbounded_tag IS NULL THEN NULL
            ELSE GREATEST(LEAST(unbounded_tag, 100), 0)::NUMERIC
        END AS tag,
        CASE
            WHEN unbounded_tag_proposition IS NULL THEN NULL
            ELSE GREATEST(
                LEAST(
                    unbounded_tag_proposition,
                    100
                ),
                0
            )::NUMERIC
        END AS tag_proposition
    FROM get_unbounded_ta
)

SELECT * FROM get_bounded_ta