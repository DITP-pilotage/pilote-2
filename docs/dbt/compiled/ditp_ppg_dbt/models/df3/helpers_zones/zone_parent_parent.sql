-- Pour chaque zone, on récupère tous ses parents
-- et grand parents ainsi que leur type de zone
--	Utile pour les aggrégations géographiques.

WITH
-- Unnest des parents des parents
zones_unnest_parent_parent AS (
    SELECT
        zone_id,
        zone_type,
        zone_parent,
        zone_parent_type,
        UNNEST(STRING_TO_ARRAY(zone_parent_parent, ' | ')) AS zone_parent_parent
    FROM "dev_pilote__6230"."df3"."zone_parent"
),

-- Ajout du type de zone des parents parents
zones_parent_parent_type AS (
    SELECT
        zones_unnest_parent_parent.*,
        zones.maille AS zone_parent_parent_type,
        zones.zone_parent AS zone_parent_parent_parent
    FROM zones_unnest_parent_parent
    LEFT JOIN "dev_pilote__6230"."raw_data"."stg_ppg_metadata__zones" AS zones
        ON zones_unnest_parent_parent.zone_parent_parent = zones.id
)

-- on supprime les doublons de parent_parent
-- Ainsi, si X a comme parent_parent Y,
-- il n'y aura qu'une ligne pour le spécifier
SELECT DISTINCT
    zone_id,
    zone_type,
    zone_parent_parent,
    zone_parent_parent_type,
    zone_parent_parent_parent
FROM zones_parent_parent_type