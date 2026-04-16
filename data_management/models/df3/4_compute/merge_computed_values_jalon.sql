{{ config(materialized='table') }}

-- TODO: modele inutile pour le moment

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

SELECT
    COALESCE(last_vaca_jalon.indic_id, last_vacg_jalon.indic_id) AS indic_id,
    COALESCE(last_vaca_jalon.zone_id, last_vacg_jalon.zone_id) AS zone_id,
    COALESCE(last_vaca_jalon.jalon, last_vacg_jalon.jalon) AS jalon,
    COALESCE(last_vaca_jalon.date_vaca, last_vacg_jalon.date_vacg)
        AS date_valeur,
    last_vaca_jalon.vaca,
    last_vacg_jalon.vacg,
    vca_jalon.vca AS vca_courant,
    vca_jalon.vca_date AS vca_courant_date,
    get_vig.vig,
    get_vig.vig_date,
    get_vcg.vcg,
    get_vcg.vcg_date
FROM
    {{ ref('get_last_vaca_jalon') }} AS last_vaca_jalon
LEFT JOIN
    {{ ref('get_last_vacg_jalon') }} AS last_vacg_jalon
    ON
        last_vaca_jalon.indic_id = last_vacg_jalon.indic_id
        AND last_vaca_jalon.zone_id = last_vacg_jalon.zone_id
        AND last_vaca_jalon.date_vaca = last_vacg_jalon.date_vacg
        AND last_vaca_jalon.jalon = last_vacg_jalon.jalon
LEFT JOIN
    {{ ref('get_vca_jalon') }} AS vca_jalon
    ON
        last_vaca_jalon.indic_id = vca_jalon.indic_id
        AND last_vaca_jalon.zone_id = vca_jalon.zone_id
        AND last_vaca_jalon.jalon = vca_jalon.jalon
LEFT JOIN
    {{ ref('get_vig') }} AS get_vig
    ON
        last_vaca_jalon.indic_id = get_vig.indic_id
        AND last_vaca_jalon.zone_id = get_vig.zone_id
LEFT JOIN
    {{ ref('get_vcg') }} AS get_vcg
    ON
        last_vaca_jalon.indic_id = get_vcg.indic_id
        AND last_vaca_jalon.zone_id = get_vcg.zone_id
