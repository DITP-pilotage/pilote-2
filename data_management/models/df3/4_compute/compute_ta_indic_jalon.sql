{{ config(materialized = 'table') }}


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
        prop.valeur_actuelle_proposee AS vacp,
        prop_v2.valeur_avancement_proposee as vacp_v2,
        prop_v2.date_valeur_avancement as date_valeur_proposition_v2
    FROM {{ ref('stg_ppg_metadata__zones') }} AS zones
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
    CROSS JOIN {{ ref('jalons_a_etudier') }} as jalons
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
            AND prop.date_valeur_actuelle::date = a.date_vaca::date
    LEFT JOIN
        {{ ref('int_propositions_valeurs_v2') }} AS prop_v2
        ON
            meta_indic.id = prop_v2.indic_id
            AND zones.id = prop_v2.zone_id

),

get_unbounded_ta AS (
    SELECT
        a.*,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vca', 'vaca') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vca', 'vaca') }}
        END AS unbounded_taa,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vca', 'vacp') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vca', 'vacp') }}
        END AS unbounded_taa_proposition,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vca', 'vacp_v2') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vca', 'vacp_v2') }}
        END AS unbounded_taa_proposition_v2,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vcg', 'vacg') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vcg', 'vacg') }}
        END AS unbounded_tag,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vcg', 'vacp') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vcg', 'vacp') }}
        END AS unbounded_tag_proposition,
        CASE
            WHEN
                b.tendance IN ('HAUSSE', 'STABLE')
                THEN {{ compute_ta_hausse_macro('vig', 'vcg', 'vacp_v2') }}
            WHEN
                b.tendance IN ('BAISSE')
                THEN {{ compute_ta_baisse_macro('vig', 'vcg', 'vacp_v2') }}
        END AS unbounded_tag_proposition_v2

    FROM get_val_jalons AS a
    RIGHT JOIN
        {{ source('parametrage_indicateurs', 'metadata_parametrage_indicateurs') }} AS b
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
            WHEN unbounded_taa_proposition_v2 IS null THEN null
            ELSE greatest(
                least(
                    unbounded_taa_proposition_v2,
                    100
                ),
                0
            )::numeric
        END AS taa_proposition_v2,
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
        END AS tag_proposition,
        CASE
            WHEN unbounded_tag_proposition_v2 IS null THEN null
            ELSE greatest(
                least(
                    unbounded_tag_proposition_v2,
                    100
                ),
                0
            )::numeric
        END AS tag_proposition_v2
    FROM get_unbounded_ta
)

SELECT * FROM get_bounded_ta