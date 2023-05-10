SELECT
    indicateur_id,
    zone_id,
    date_releve,
    type_mesure,
    valeur,
    zone_code,
    zone_type
FROM {{ ref("faits_indicateur_departemental") }}
UNION
SELECT
    indicateur_id,
    zone_id,
    mois_releve as date_releve,
    type_mesure,
    valeur,
    zone_code,
    zone_type
FROM {{ ref("faits_indicateur_regional") }}
UNION
SELECT
    indicateur_id,
    zone_id,
    mois_releve as date_releve,
    type_mesure,
    valeur,
    zone_code,
    zone_type
FROM {{ ref("faits_indicateur_national") }}
