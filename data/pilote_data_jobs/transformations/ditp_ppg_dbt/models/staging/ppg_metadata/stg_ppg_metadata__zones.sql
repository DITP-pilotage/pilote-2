with

source as (

    select * from {{ ref('metadata_zones') }}

),

renamed as (

    select
        zone_id as id,
        nom,
        zone_code as code_insee,
        zone_type as maille,
        string_to_array(zone_parent, ' | ') as zone_parent_id

    from source

)

select * from renamed