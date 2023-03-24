with

source as (

    select * from {{ ref('metadata_axes') }}

),

renamed as (

    select
        axe_id as id,
        axe_short as nom_court,
        axe_name as nom,
        axe_desc as description

    from source

)

select * from renamed