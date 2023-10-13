SELECT
    date_import,
    date_releve,
    indicateur_id,
    type_mesure,
    valeur,
    /* dimensions zone */
    meta_zone.zone_id,
    meta_zone.zone_code,
    meta_zone.zone_type,
    meta_zone.zone_id_parent,
    meta_zone_parent.zone_code as zone_code_parent,
    meta_zone_parent.zone_type as zone_type_parent
FROM {{ ref("stg_import_fichier__mesures_indicateurs") }}
NATURAL JOIN {{ ref("stg_ppg_metadata__zones_unnest")}} as meta_zone
LEFT JOIN {{ ref("metadata_zones")}} as meta_zone_parent on meta_zone_parent.zone_id = meta_zone.zone_id_parent
ORDER BY date_releve
