with

source as (

    select * from {{ ref('metadata_chantiers') }}

),

renamed as (

    select
        chantier_id as id,
        ch_code as code,
        ch_descr as description,
        ch_nom as nom,
        ch_ppg as ppg_id,
        ch_perseverant as id_chantier_perseverant,
        string_to_array("porteur_ids_noDAC", ' | ') as ministeres_ids,
        string_to_array("porteur_shorts_noDAC", ' | ') as ministeres_polygrammes,
        string_to_array("porteur_shorts_DAC", ' | ') as directeurs_administration_centrale_polygrammes,
        string_to_array("porteur_ids_DAC", ' | ') as directeurs_administration_centrale_ids,
        string_to_array(ch_per, ' | ') as perimetre_ids,
        string_to_array(ch_dp, ' | ') as directeurs_projet_noms,
        string_to_array(ch_dp_mail, ' | ') as directeurs_projet_mails,
        ch_territo as est_territorialise,
        engagement_short as nom_engagement,
        ch_hidden_pilote as est_cache_dans_pilote,
        ch_saisie_ate as ate,
        ch_state as statut,
        CAST(zg_applicable as TEXT) as zone_groupe_applicable,
        string_to_array(maille_applicable, ' | ') as maille_applicable,
        case
            when ch_territo and maille_applicable = 'REG | NAT' 	then 'REG'
            when ch_territo and maille_applicable is null 			then 'DEPT'
            else 'NAT'
        end as "maille_pilotage"

    from source

)

select * from renamed
