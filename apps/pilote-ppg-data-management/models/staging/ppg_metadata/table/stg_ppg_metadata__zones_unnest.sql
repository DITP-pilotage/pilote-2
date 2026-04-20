WITH

source AS (

    SELECT * FROM {{ source('python_load', 'metadata_zones') }}

),

renamed AS (

    SELECT
        zone_id,
        nom AS zone_nom,
        zone_code,
        zone_type,
        UNNEST(STRING_TO_ARRAY(COALESCE(TRIM(zone_parent), 'N/A'), ' | '))
            AS zone_id_parent
    FROM source

)

SELECT * FROM renamed
