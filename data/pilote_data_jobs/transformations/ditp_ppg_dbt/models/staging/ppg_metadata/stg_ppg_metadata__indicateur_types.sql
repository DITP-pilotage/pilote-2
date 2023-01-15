with

source as (

    select * from {{ source('ppg_metadata', 'indicateur_type') }}

),

renamed as (

    select
        indic_type_id as id,
        indic_type_name as nom,
        indic_type_descr as description,
        indic_type_rank as rang

    from source

)

select * from renamed