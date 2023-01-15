with

source as (

    select * from {{ source('ppg_metadata', 'metadata_perimetre') }}

),

renamed as (

    select
        perimetre_id as id,
        per_nom as nom

    from source

)

select * from renamed