with

source as (

    select * from {{ source('ppg_metadata', 'metadata_chantier') }}

),

renamed as (

    select
        chantier_id as id,
        ch_code as code,
        ch_descr as description,
        ch_nom as nom,
        ch_ppg as ppg,
        ch_perseverant as id_chantier_perseverant,
        string_to_array("porteur_ids_noDAC", ' | ') as ministeres_id,
        string_to_array("porteur_shorts_noDAC", ' | ') as ministeres_polygrammes, -- a changer car liste
        string_to_array("porteur_shorts_DAC", ' | ') as directeur_administration_centrale_ids,-- a changer car liste
        string_to_array("porteur_ids_DAC", ' | ') as directeur_administration_centrale_polygrammes,-- a changer car liste
        string_to_array(ch_per, ' | ') as perimetre_ids,
        ch_dp as directeur_projet_nom

    from source

)

select * from renamed
