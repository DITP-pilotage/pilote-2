-- Pour chaque zone, on récupère tous ses parents, et grand parents ainsi que leur type de zone
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
    FROM {{ ref('zone_parent') }}
),

-- Ajout du type de zone des parents parents
zones_parent_parent_type AS (
    SELECT
        a.*,
        b.maille AS zone_parent_parent_type,
        b.zone_parent AS zone_parent_parent_parent
    FROM zones_unnest_parent_parent AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS b
        ON a.zone_parent_parent = b.id
),

-- on supprime les doublons de parent_parent
-- Ainsi, si X a comme parent_parent Y, il n'y aura qu'une ligne pour le spécifier
zone_parent_parent_dedup AS (
    SELECT DISTINCT
        zone_id,
        zone_type,
        zone_parent_parent,
        zone_parent_parent_type,
        zone_parent_parent_parent
    FROM zones_parent_parent_type
)

SELECT * FROM zone_parent_parent_dedup
