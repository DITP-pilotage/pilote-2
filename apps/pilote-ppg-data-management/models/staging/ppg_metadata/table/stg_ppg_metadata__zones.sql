WITH

source AS (

    SELECT * FROM {{ source('ppg_metadata', 'metadata_zones') }}

),

renamed AS (

    SELECT
        zone_id AS id,
        nom,
        zone_code AS code_insee,
        zone_type AS maille,
        zone_parent,
        STRING_TO_ARRAY(zone_parent, ' | ') AS zone_parent_id

    FROM source

),

filtered AS (

    SELECT *
    FROM renamed
    WHERE
        zone_parent_id IS NULL
        OR (code_insee <> 'COM' AND NOT 'COM' = ANY(zone_parent_id))
)

SELECT * FROM filtered
