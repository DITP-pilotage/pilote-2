with

source as (

    select * from {{ ref('metadata_porteurs') }}

),

renamed as (

    select
        porteur_id as id,
        porteur_short as acronyme,
        porteur_name as nom,
        porteur_desc as description,
        porteur_type_id as porteur_type_id,
        porteur_type_short as porteur_type_acronyme,
        porteur_type_name as porteur_type_nom,
        porteur_directeur as directeur,
        porteur_name_short as nom_court,
        porteur_picto as icone

    from source

)

select * from renamed