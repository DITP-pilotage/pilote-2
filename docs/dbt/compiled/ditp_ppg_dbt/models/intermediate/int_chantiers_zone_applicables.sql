WITH chantiers_zone_applicables AS (
    SELECT DISTINCT
        chantiers.id AS chantier_id,
        zonegroup.child_zone_id AS zone_id,
        TRUE AS est_applicable
    FROM
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__chantiers" AS chantiers
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zonegroup_unnest" AS zonegroup
        ON chantiers.zone_groupe_applicable = zonegroup.zone_group_id
    WHERE
        chantiers.zone_groupe_applicable IS NOT NULL
),

chantiers_za_toutes_zone AS (
    SELECT DISTINCT
        chantiers.chantier_id,
        zones.id AS zone_id,
        zones.maille
    FROM
        chantiers_zone_applicables AS chantiers
    CROSS JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
)

SELECT
    chantiers_za_toutes_zone.chantier_id,
    chantiers_za_toutes_zone.zone_id,
    COALESCE(chantiers_zone_applicables.est_applicable, FALSE)
        AS zone_est_applicable,
    chantiers_za_toutes_zone.maille
FROM
    chantiers_za_toutes_zone
LEFT JOIN chantiers_zone_applicables
    ON
        chantiers_za_toutes_zone.chantier_id
        = chantiers_zone_applicables.chantier_id
        AND chantiers_za_toutes_zone.zone_id
        = chantiers_zone_applicables.zone_id