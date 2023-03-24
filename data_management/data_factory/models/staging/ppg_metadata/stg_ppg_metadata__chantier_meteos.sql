with

source as (

    select * from {{ ref('metadata_chantier_meteos') }}

),

renamed as (

    select
        ch_meteo_id as id,
        ch_meteo_name as nom,
        ch_meteo_descr as description,
        ch_meteo_name_dfakto as nom_dfakto

    from source

)

select * from renamed