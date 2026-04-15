{{ config(materialized = 'table') }}


WITH get_val_jalons AS (
    SELECT
        meta_indic.id AS indic_id,
        zones.id AS zone_id,
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
        prop.valeur_avancement_proposee AS vacp,
        prop.date_valeur_avancement AS date_valeur_proposition
    FROM {{ ref('stg_ppg_metadata__zones') }} AS zones
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
    CROSS JOIN {{ ref('jalons_a_etudier') }} AS jalons
    LEFT JOIN {{ ref('get_last_vaca_jalon') }} AS a
        ON
            meta_indic.id = a.indic_id
            AND zones.id = a.zone_id
            AND jalons.jalon = a.jalon
    LEFT JOIN
        {{ ref('get_last_vacg_jalon') }} AS g
        ON
            meta_indic.id = g.indic_id
            AND zones.id = g.zone_id
            AND jalons.jalon = g.jalon
    LEFT JOIN
        {{ ref('get_vig') }} AS e
        ON meta_indic.id = e.indic_id AND zones.id = e.zone_id
    LEFT JOIN
        {{ ref('get_vca_jalon') }} AS f
        ON
            meta_indic.id = f.indic_id
            AND zones.id = f.zone_id
            AND jalons.jalon = f.jalon
    LEFT JOIN
        {{ ref('get_vcg') }} AS h
        ON meta_indic.id = h.indic_id AND zones.id = h.zone_id
    LEFT JOIN
        {{ ref('int_propositions_valeurs') }} AS prop
        ON
            meta_indic.id = prop.indic_id
            AND zones.id = prop.zone_id
            AND jalons.jalon >= EXTRACT(YEAR FROM prop.date_valeur_avancement)

),

get_unbounded_ta AS (
    SELECT
        computed_values_jalon.*,
        {{ compute_ta('computed_values_jalon.vig', 'computed_values_jalon.vca', 'computed_values_jalon.vaca', 'parametre_indic.tendance') }} AS unbounded_taa, -- noqa: LT05
        {{ compute_ta('computed_values_jalon.vig', 'computed_values_jalon.vca', 'computed_values_jalon.vacp', 'parametre_indic.tendance') }} AS unbounded_taa_proposition, -- noqa: LT05
        {{ compute_ta('computed_values_jalon.vig', 'computed_values_jalon.vcg', 'computed_values_jalon.vacg', 'parametre_indic.tendance') }} AS unbounded_tag, -- noqa: LT05
        {{ compute_ta('computed_values_jalon.vig', 'computed_values_jalon.vcg', 'computed_values_jalon.vacp', 'parametre_indic.tendance') }} AS unbounded_tag_proposition -- noqa: LT05
    FROM get_val_jalons AS computed_values_jalon
    LEFT OUTER JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }}
            AS parametre_indic
        ON computed_values_jalon.indic_id = parametre_indic.indic_id
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
