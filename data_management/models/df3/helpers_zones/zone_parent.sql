-- Pour chaque zone, on récupère tous ses parents
--	Utile pour les aggrégations géographiques.

-- Unnest des parent
WITH zones_unnest_parent AS (
    SELECT
        a.id AS zone_id,
        a.maille AS zone_type,
        UNNEST(STRING_TO_ARRAY(a.zone_parent, ' | ')) AS zone_parent
    FROM {{ ref('stg_ppg_metadata__zones') }} AS a
),

-- Ajout du type de zone des parents
zones_parent_type AS (
    SELECT
        a.*,
        b.maille AS zone_parent_type,
        b.zone_parent AS zone_parent_parent
    FROM zones_unnest_parent AS a
    LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS b
        ON a.zone_parent = b.id
)

SELECT * FROM zones_parent_type
