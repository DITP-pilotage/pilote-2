with

source as (

    select * from {{ ref('metadata_porteurs') }}

),

renamed as (

    select
        porteur_id as id,
        porteur_short as polygramme,
        porteur_name as nom,
        porteur_desc as description,
        porteur_type_id as porteur_type_id,
        porteur_type_short as porteur_type_polygramme,
        porteur_type_name as porteur_type_nom,
        porteur_directeur as directeur,
        porteur_name_short as nom_court,
        porteur_picto as pictogramme

    from source

)

select * from renamed