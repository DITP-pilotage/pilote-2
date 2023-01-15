with

source as (

    select * from {{ source('ppg_metadata', 'metadata_ppg') }}

),

renamed as (

    select
        ppg_id as id,
        ppg_axe as axe,
        ppg_code as code,
        ppg_desc as description,
        ppg_nom as nom,
        porteur_shorts as nom_court,
        porteur_ids

    from source

)

select * from renamed