WITH

init AS (
    SELECT * FROM {{ source('ppg_metadata', 'metadata_zonegroup') }}
),

unnest_trgt AS (
    SELECT
        *,
        UNNEST(zg_zones) AS zg_zones_unnest
    FROM init
),

get_child_zone_types AS (
    SELECT
        *,
        SPLIT_PART(zg_zones_unnest, '.', 1) AS zone_parent,
        SPLIT_PART(zg_zones_unnest, '.', 2) AS child_zone_type
    FROM unnest_trgt
),

unnest_parents AS (
    SELECT
        *,
        UNNEST(STRING_TO_ARRAY(zone_parent, ' | ')) AS parent
    FROM {{ source('ppg_metadata', 'metadata_zones') }}
),

find_children AS (
    SELECT
        get_child_zone_types.*,
        unnest_parents.*
    FROM get_child_zone_types
    LEFT JOIN
        unnest_parents AS unnest_parents
        ON
            get_child_zone_types.zone_parent = unnest_parents.parent
            AND get_child_zone_types.child_zone_type = unnest_parents.zone_type
),

fill_zone_no_child AS (
    SELECT
        *,
        COALESCE(zone_id, zg_zones_unnest) AS zone_id_filled
    FROM find_children
)

SELECT
    zone_group_id,
    zone_id_filled AS child_zone_id
FROM fill_zone_no_child
