WITH get_unbounded_ta AS (
    SELECT
        computed_values.*,
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vca_courant AND computed_values.vaca >= computed_values.vca_courant
                    THEN 100
                WHEN computed_values.vig >= computed_values.vca_courant AND computed_values.vaca < computed_values.vca_courant
                    THEN 0
                ELSE ROUND((100 * (computed_values.vaca - computed_values.vig) / (computed_values.vca_courant - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vca_courant AND computed_values.vaca <= computed_values.vca_courant
                    THEN 100
                WHEN computed_values.vig <= computed_values.vca_courant AND computed_values.vaca > computed_values.vca_courant
                    THEN 0
                ELSE ROUND((100 * (computed_values.vaca - computed_values.vig) / (computed_values.vca_courant - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_taa_courant, -- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vca_adate AND computed_values.vaca >= computed_values.vca_adate
                    THEN 100
                WHEN computed_values.vig >= computed_values.vca_adate AND computed_values.vaca < computed_values.vca_adate
                    THEN 0
                ELSE ROUND((100 * (computed_values.vaca - computed_values.vig) / (computed_values.vca_adate - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vca_adate AND computed_values.vaca <= computed_values.vca_adate
                    THEN 100
                WHEN computed_values.vig <= computed_values.vca_adate AND computed_values.vaca > computed_values.vca_adate
                    THEN 0
                ELSE ROUND((100 * (computed_values.vaca - computed_values.vig) / (computed_values.vca_adate - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_taa_adate,-- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vcg AND computed_values.vacg >= computed_values.vcg
                    THEN 100
                WHEN computed_values.vig >= computed_values.vcg AND computed_values.vacg < computed_values.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacg - computed_values.vig) / (computed_values.vcg - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vcg AND computed_values.vacg <= computed_values.vcg
                    THEN 100
                WHEN computed_values.vig <= computed_values.vcg AND computed_values.vacg > computed_values.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacg - computed_values.vig) / (computed_values.vcg - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tag,-- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vcg AND computed_values.vacp >= computed_values.vcg
                    THEN 100
                WHEN computed_values.vig >= computed_values.vcg AND computed_values.vacp < computed_values.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vcg - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vcg AND computed_values.vacp <= computed_values.vcg
                    THEN 100
                WHEN computed_values.vig <= computed_values.vcg AND computed_values.vacp > computed_values.vcg
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vcg - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tap_global,-- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vca_courant AND computed_values.vacp >= computed_values.vca_courant
                    THEN 100
                WHEN computed_values.vig >= computed_values.vca_courant AND computed_values.vacp < computed_values.vca_courant
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vca_courant - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vca_courant AND computed_values.vacp <= computed_values.vca_courant
                    THEN 100
                WHEN computed_values.vig <= computed_values.vca_courant AND computed_values.vacp > computed_values.vca_courant
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vca_courant - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tap_courant,-- noqa: LT05
        

CASE
    WHEN parametre_indic.tendance IN ('HAUSSE', 'STABLE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig >= computed_values.vca_adate AND computed_values.vacp >= computed_values.vca_adate
                    THEN 100
                WHEN computed_values.vig >= computed_values.vca_adate AND computed_values.vacp < computed_values.vca_adate
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vca_adate - computed_values.vig))::NUMERIC, 2) 
            END
    WHEN parametre_indic.tendance IN ('BAISSE')
        THEN 
            CASE
                -- VI<=VC
                WHEN computed_values.vig <= computed_values.vca_adate AND computed_values.vacp <= computed_values.vca_adate
                    THEN 100
                WHEN computed_values.vig <= computed_values.vca_adate AND computed_values.vacp > computed_values.vca_adate
                    THEN 0
                ELSE ROUND((100 * (computed_values.vacp - computed_values.vig) / (computed_values.vca_adate - computed_values.vig))::NUMERIC, 2) 
            END
    ELSE NULL
END
 AS unbounded_tap_adate -- noqa: LT05
    FROM "dev_pilote__6230"."df3"."merge_computed_values" AS computed_values
    LEFT OUTER JOIN
        "dev_pilote__6230"."raw_data"."metadata_parametrage_indicateurs" -- noqa: LT05
            AS parametre_indic
        ON computed_values.indic_id = parametre_indic.indic_id
    WHERE parametre_indic.tendance IS NOT NULL
),

get_bounded_ta AS (
    SELECT
        *,
        CASE
            WHEN unbounded_taa_courant IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_taa_courant, 100), 0)::NUMERIC
        END AS taa_courant,
        CASE
            WHEN unbounded_taa_adate IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_taa_adate, 100), 0)::NUMERIC
        END AS taa_adate,
        CASE
            WHEN unbounded_tag IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_tag, 100), 0)::NUMERIC
        END AS tag,
        CASE
            WHEN unbounded_tap_global IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_tap_global, 100), 0)::NUMERIC
        END AS tap_global,
        CASE
            WHEN unbounded_tap_courant IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_tap_courant, 100), 0)::NUMERIC
        END AS tap_courant,
        CASE
            WHEN unbounded_tap_adate IS NULL THEN NULL ELSE
                GREATEST(LEAST(unbounded_tap_adate, 100), 0)::NUMERIC
        END AS tap_adate
    FROM get_unbounded_ta
)

SELECT * FROM get_bounded_ta