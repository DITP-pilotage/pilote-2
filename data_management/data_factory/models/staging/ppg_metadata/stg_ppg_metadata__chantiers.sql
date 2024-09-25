WITH

source AS (

    SELECT * FROM {{ ref('metadata_chantiers') }}

),

renamed AS (

    SELECT
        chantier_id AS id,
        ch_code AS code,
        ch_descr AS description,
        ch_nom AS nom,
        axe_id,
        ch_perseverant AS id_chantier_perseverant,
        ch_territo AS est_territorialise,
        engagement_short AS nom_engagement,
        ch_hidden_pilote AS est_cache_dans_pilote,
        ch_saisie_ate AS ate,
        ch_state AS statut,
        cast(zg_applicable AS TEXT) AS zone_groupe_applicable,
        string_to_array("porteur_ids_noDAC", ' | ') AS ministeres_ids,
        string_to_array(
            "porteur_shorts_noDAC", ' | '
        ) AS ministeres_polygrammes,
        string_to_array(
            "porteur_shorts_DAC", ' | '
        ) AS directeurs_administration_centrale_polygrammes,
        string_to_array(
            "porteur_ids_DAC", ' | '
        ) AS directeurs_administration_centrale_ids,
        string_to_array(ch_per, ' | ') AS perimetre_ids,
        string_to_array(ch_dp, ' | ') AS directeurs_projet_noms,
        string_to_array(ch_dp_mail, ' | ') AS directeurs_projet_mails,
        -- Maille applicable déclarée
        string_to_array(maille_applicable, ' | ') AS maille_applicable_declaree,
        upper(cast(replicate_val_reg_to AS TEXT)) AS replicate_val_reg_to,
        upper(cast(replicate_val_nat_to AS TEXT)) AS replicate_val_nat_to,
        ch_cible_attendue,
        case
            when ch_territo and maille_applicable = 'REG | NAT' 	then 'REG'
            when ch_territo and maille_applicable is null 			then 'DEPT'
            else 'NAT'
        end as "maille_pilotage"

    FROM source

),

-- Calcul des mailles applicables en fonction 
--      des réplications de données configurées
get_maille_applicable AS (

    SELECT
        *,
        CASE
            -- [enabled] REG -> DEPT
            WHEN
                replicate_val_reg_to = 'DEPT'
                AND maille_applicable_declaree = ARRAY['REG', 'NAT']
                THEN ARRAY['DEPT', 'REG', 'NAT']
            WHEN
                replicate_val_reg_to = 'DEPT'
                AND maille_applicable_declaree = ARRAY['REG']
                THEN ARRAY['DEPT', 'REG']

            -- [disabled] NAT -> REG
            {# WHEN
                replicate_val_nat_to = 'REG'
                AND maille_applicable_declaree = ARRAY['DEPT', 'NAT']
                THEN ARRAY['DEPT', 'REG', 'NAT']
            WHEN
                replicate_val_nat_to = 'REG'
                AND maille_applicable_declaree = ARRAY['NAT']
                THEN ARRAY['REG', 'NAT'] #}

            -- [disabled] NAT -> DEPT
            {# WHEN
                replicate_val_nat_to = 'DEPT'
                AND maille_applicable_declaree = ARRAY['REG', 'NAT']
                THEN ARRAY['DEPT', 'REG', 'NAT']
            WHEN
                replicate_val_nat_to = 'DEPT'
                AND maille_applicable_declaree = ARRAY['NAT']
                THEN ARRAY['DEPT', 'NAT'] #}

            ELSE maille_applicable_declaree
        END AS maille_applicable
    FROM renamed

)

SELECT * FROM get_maille_applicable
