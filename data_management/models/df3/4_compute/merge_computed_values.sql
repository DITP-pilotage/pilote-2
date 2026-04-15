{{ config(
    materialized='table',
    pre_hook="SET max_parallel_workers_per_gather = 0;"
) }}

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

WITH current_year_vca AS (
    SELECT
        indic_id,
        zone_id,
        vca,
        vca_date
    FROM {{ ref('get_vca_jalon') }}
    WHERE jalon = DATE_PART('year', NOW())
)

SELECT
    a.id,
    a.date_import,
    a.indic_id,
    a.zone_id,
    a.metric_date,
    a.vi,
    a.va,
    a.vc,
    b.vaca,
    c.vacg,
    vacp.vacp,
    vacp.metric_date AS date_valeur_proposition,
    -- VCA pour l'année COURANTE (rule::620)
    d2.vca AS vca_courant,
    d2.vca_date AS vca_courant_date,
    -- VCA pour l'année de la a.metric_date (pas utilisé, mais valeur avant rule::620)
    d.vca AS vca_adate,
    d.vca_date AS vca_adate_date,
    e.vig,
    e.vig_date,
    f.vcg,
    f.vcg_date
FROM {{ ref('pivot_mesures') }} AS a
LEFT JOIN
    {{ ref('compute_vaca') }} AS b
    ON
        a.indic_id = b.indic_id
        AND a.zone_id = b.zone_id
        AND a.metric_date = b.metric_date
LEFT JOIN
    {{ ref('compute_vacg') }} AS c
    ON
        a.indic_id = c.indic_id
        AND a.zone_id = c.zone_id
        AND a.metric_date = c.metric_date
LEFT JOIN
    {{ ref('compute_vacp') }} AS vacp
    ON a.indic_id = vacp.indic_id AND a.zone_id = vacp.zone_id
-- La VCA ici est à l'année de la VA (année de a.metric_date)
LEFT JOIN
    {{ ref('get_vca_jalon') }} AS d
    ON
        a.indic_id = d.indic_id
        AND a.zone_id = d.zone_id
        AND DATE_PART('year', a.metric_date) = d.jalon
-- La VCA ici est en date de l'année courante
LEFT JOIN
    current_year_vca AS d2
    ON a.indic_id = d2.indic_id AND a.zone_id = d2.zone_id
LEFT JOIN
    {{ ref('get_vig') }} AS e
    ON a.indic_id = e.indic_id AND a.zone_id = e.zone_id
LEFT JOIN
    {{ ref('get_vcg') }} AS f
    ON a.indic_id = f.indic_id AND a.zone_id = f.zone_id
