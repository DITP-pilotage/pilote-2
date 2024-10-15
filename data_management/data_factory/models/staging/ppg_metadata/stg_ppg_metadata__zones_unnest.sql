with

source as (

    select * from {{ source('dlt_load', 'metadata_zones') }}

),

renamed as (

    SELECT
        zone_id,
        nom as zone_nom,
        zone_code,
        zone_type,
        UNNEST(string_to_array(COALESCE(trim(zone_parent), 'N/A'), ' | ')) as zone_id_parent
    FROM source

)

select * from renamed
