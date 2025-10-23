{{ config(materialized='table') }}

-- TODO: modele inutile pour le moment

-- On fait la jointure des:
--  VACA, VACG, VCA, VCG, VIG

SELECT
    COALESCE(a.indic_id, b.indic_id) AS indic_id,
    COALESCE(a.zone_id, b.zone_id) AS zone_id,
    COALESCE(a.jalon, b.jalon) AS jalon,
    COALESCE(a.date_vaca, b.date_vacg) AS date_valeur,
    a.vaca,
    b.vacg,
    vca.vca as vca_courant, 
    vca.vca_date as vca_courant_date,
    e.vig, e.vig_date,
    f.vcg, f.vcg_date
FROM 
{{ ref('get_last_vaca_jalon') }} AS a
LEFT JOIN
    {{ ref('get_last_vacg_jalon') }} AS b
    ON
        a.indic_id = b.indic_id
        AND a.zone_id = b.zone_id
        AND a.date_vaca = b.date_vacg
        AND a.jalon = b.jalon
left join {{ ref('get_vca_jalon') }} vca on a.indic_id =vca.indic_id and a.zone_id =vca.zone_id and a.jalon=vca.jalon 
left join {{ ref('get_vig') }} e on a.indic_id =e.indic_id and a.zone_id =e.zone_id
left join {{ ref('get_vcg') }} f on a.indic_id =f.indic_id and a.zone_id =f.zone_id