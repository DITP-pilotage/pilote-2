with

source as (

    select * from {{ ref('metadata_zones') }}

),

renamed as (

    SELECT
        zone_id,
        nom as zone_nom,
        zone_code,
        zone_type,
        UNNEST(string_to_array(trim(zone_parent), ' | ')) as zone_id_parent
    FROM source

)

select * from renamed