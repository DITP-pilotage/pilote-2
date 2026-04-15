WITH get_unbounded_ta AS (
    SELECT
        computed_values.*,
        {{ compute_ta('computed_values.vig', 'computed_values.vca_courant', 'computed_values.vaca', 'parametre_indic.tendance') }} AS unbounded_taa_courant, -- noqa: LT05
        {{ compute_ta('computed_values.vig', 'computed_values.vca_adate', 'computed_values.vaca', 'parametre_indic.tendance') }} AS unbounded_taa_adate,-- noqa: LT05
        {{ compute_ta('computed_values.vig', 'computed_values.vcg', 'computed_values.vacg', 'parametre_indic.tendance') }} AS unbounded_tag,-- noqa: LT05
        {{ compute_ta('computed_values.vig', 'computed_values.vcg', 'computed_values.vacp', 'parametre_indic.tendance') }} AS unbounded_tap_global,-- noqa: LT05
        {{ compute_ta('computed_values.vig', 'computed_values.vca_courant', 'computed_values.vacp', 'parametre_indic.tendance') }} AS unbounded_tap_courant,-- noqa: LT05
        {{ compute_ta('computed_values.vig', 'computed_values.vca_adate', 'computed_values.vacp', 'parametre_indic.tendance') }} AS unbounded_tap_adate -- noqa: LT05
    FROM {{ ref('merge_computed_values') }} AS computed_values
    LEFT OUTER JOIN {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS parametre_indic 
        ON computed_values.indic_id = parametre_indic.indic_id
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
