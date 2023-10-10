WITH 

init AS (
    SELECT  * FROM {{ ref('metadata_zonegroup') }}
),

unnest_trgt AS (
    SELECT *, UNNEST(string_to_array(zg_zones, ' | ')) AS zg_zones_unnest FROM init
),

get_child_zone_types AS (
    SELECT 
        *, 
        split_part(zg_zones_unnest, '.', 1) AS zone_parent,
        split_part(zg_zones_unnest, '.', 2) AS child_zone_type
    FROM unnest_trgt
),

unnest_parents AS (
    SELECT 
        *,
        UNNEST(string_to_array(zone_parent, ' | ')) AS parent 
    FROM {{ ref('metadata_zones') }} 
),

find_children AS (
    SELECT * 
    FROM get_child_zone_types a
    LEFT JOIN unnest_parents b ON a.zone_parent=b.parent AND a.child_zone_type=b.zone_type
), 

fill_zone_no_child AS (
	SELECT 
        *,
        COALESCE(zone_id, zg_zones_unnest) AS zone_id_filled
    FROM find_children
),

clean_results AS (
    SELECT
        zone_group_id,
        zone_id_filled AS child_zone_id
    FROM fill_zone_no_child
)

SELECT * FROM clean_results ORDER BY zone_group_id