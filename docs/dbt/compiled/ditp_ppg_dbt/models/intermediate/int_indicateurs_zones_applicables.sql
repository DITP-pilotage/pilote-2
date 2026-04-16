WITH

indicateurs_zone_applicables AS (
    SELECT DISTINCT
        indic.id AS indic_id,
        indic.chantier_id,
        zonegroup.child_zone_id AS zone_id,
        TRUE AS est_applicable
    FROM "dev_pilote__6230"."raw_data"."stg_ppg_metadata__indicateurs" AS indic
    LEFT JOIN
        "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zonegroup_unnest" AS zonegroup
        ON indic.zone_groupe_applicable = zonegroup.zone_group_id
    WHERE indic.zone_groupe_applicable IS NOT NULL
),

indicateurs_za_toutes_zone AS (
    SELECT DISTINCT
        indicateurs_zone_applicables.indic_id,
        indicateurs_zone_applicables.chantier_id,
        zones.id AS zone_id
    FROM indicateurs_zone_applicables
    CROSS JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
)

SELECT
    indicateurs_za_toutes_zone.indic_id,
    indicateurs_za_toutes_zone.chantier_id,
    indicateurs_za_toutes_zone.zone_id,
    COALESCE(indicateurs_zone_applicables.est_applicable, FALSE)
        AS est_applicable
FROM indicateurs_za_toutes_zone
LEFT JOIN indicateurs_zone_applicables
    ON
        indicateurs_za_toutes_zone.indic_id
        = indicateurs_zone_applicables.indic_id
        AND indicateurs_za_toutes_zone.zone_id
        = indicateurs_zone_applicables.zone_id