with

source as (

    select * from {{ source('ppg_metadata', 'metadata_zone') }}

),

renamed as (

    select
        zone_id as id,
        nom,
        zone_code as code_insee,
        zone_type as type,
        string_to_array(zone_parent, ' | ') as zone_parent_id

    from source

)

select * from renamed