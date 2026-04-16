-- Pour chaque zone, on récupère tous ses parents
--	Utile pour les aggrégations géographiques.

-- Unnest des parent
WITH zones_unnest_parent AS (
    SELECT
        id AS zone_id,
        maille AS zone_type,
        UNNEST(STRING_TO_ARRAY(zone_parent, ' | ')) AS zone_parent
    FROM {{ ref('stg_ppg_metadata__zones') }}
)

-- Ajout du type de zone des parents
SELECT
    zones_unnest_parent.*,
    zones.maille AS zone_parent_type,
    zones.zone_parent AS zone_parent_parent
FROM zones_unnest_parent
LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS zones
    ON zones_unnest_parent.zone_parent = zones.id
