with

source as (

    select * from {{ source('ppg_metadata', 'chantier_meteo') }}

),

renamed as (

    select
        ch_meteo_id as id,
        ch_meteo_name as nom,
        ch_meteo_descr as description

    from source

)

select * from renamed