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
        string_to_array(porteur_shorts, ' | ') as porteur_noms_court,
        string_to_array(porteur_ids, ' | ') as porteur_ids

    from source

)

select * from renamed