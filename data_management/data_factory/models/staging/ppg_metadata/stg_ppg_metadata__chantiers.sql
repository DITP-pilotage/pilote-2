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
        -- Maille applicable déclarée
        string_to_array(maille_applicable, ' | ') as maille_applicable_declaree,
        upper(replicate_val_reg_to::text) as replicate_val_reg_to, 
        upper(replicate_val_nat_to::text) as replicate_val_nat_to,
        case
            when ch_territo and maille_applicable = 'REG | NAT' 	then 'REG'
            when ch_territo and maille_applicable is null 			then 'DEPT'
            else 'NAT'
        end as "maille_pilotage"

    from source

)

-- Calcul des mailles applicables en fonction des réplications de données configurées
, get_maille_applicable as (

    select *,
    case 
        -- [enabled] REG -> DEPT
        when replicate_val_reg_to='DEPT' and maille_applicable_declaree=array['REG','NAT'] then array['DEPT', 'REG','NAT']
        when replicate_val_reg_to='DEPT' and maille_applicable_declaree=array['REG'] then array['DEPT', 'REG']

        -- [disabled] NAT -> REG
        --when replicate_val_nat_to='REG' and maille_applicable_declaree=array['DEPT','NAT'] then array['DEPT', 'REG','NAT']
        --when replicate_val_nat_to='REG' and maille_applicable_declaree=array['NAT'] then array['REG','NAT']
        
        -- [disabled] NAT -> DEPT
        --when replicate_val_nat_to='DEPT' and maille_applicable_declaree=array['REG','NAT'] then array['DEPT', 'REG','NAT']
        --when replicate_val_nat_to='DEPT' and maille_applicable_declaree=array['NAT'] then array['DEPT', 'NAT']

        else maille_applicable_declaree
    end as maille_applicable
    from renamed

)

select * from get_maille_applicable
