{{ config(materialized="table") }}

with

source as (

    select * from {{ source('python_load', 'metadata_zones') }}

),

renamed as (

    select
        zone_id as id,
        nom,
        zone_code as code_insee,
        zone_type as maille,
        zone_parent,
        string_to_array(zone_parent, ' | ') as zone_parent_id

    from source

),

filtered as (

    select
        *
    from renamed
    where zone_parent_id is NULL or (code_insee <> 'COM' and not 'COM' = ANY(zone_parent_id))
)

select * from filtered
