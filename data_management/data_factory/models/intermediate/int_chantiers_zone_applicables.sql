WITH chantiers_zone_applicables AS (
    SELECT DISTINCT
        chantiers.id AS chantier_id,
        zg.child_zone_id AS zone_id,
        true AS est_applicable
    FROM
        raw_data.stg_ppg_metadata__chantiers chantiers
        LEFT JOIN raw_data.stg_ppg_metadata__zonegroup_unnest zg ON chantiers.zone_groupe_applicable = zg.zone_group_id
    WHERE
        zone_groupe_applicable IS NOT NULL
),
chantiers_za_toutes_zone AS (
    SELECT DISTINCT
        chantiers.chantier_id,
        zones.id AS zone_id,
        zones.maille
    FROM
        chantiers_zone_applicables chantiers
        CROSS JOIN raw_data.stg_ppg_metadata__zones zones
)
SELECT
    chantiers_za_toutes_zone.chantier_id,
    chantiers_za_toutes_zone.zone_id,
    COALESCE(chantiers_zone_applicables.est_applicable, false) AS zone_est_applicable,
    maille
FROM
    chantiers_za_toutes_zone
    LEFT JOIN chantiers_zone_applicables 
   	ON chantiers_zone_applicables.chantier_id = chantiers_za_toutes_zone.chantier_id 
   	AND chantiers_zone_applicables.zone_id = chantiers_za_toutes_zone.zone_id