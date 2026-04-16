WITH

source AS (

    SELECT * FROM "dev_pilote__6230"."raw_data"."metadata_chantiers"

),

renamed AS (

    SELECT
        chantier_id AS id,
        ch_code AS code,
        ch_descr AS description,
        ch_nom AS nom,
        ch_ppg AS ppg_id,
        ch_perseverant AS id_chantier_perseverant,
        ch_territo::BOOLEAN AS est_territorialise,
        engagement_short AS nom_engagement,
        ch_hidden_pilote::TEXT::BOOLEAN AS est_cache_dans_pilote,
        ch_saisie_ate AS ate,
        ch_state AS statut,
        zg_applicable::TEXT AS zone_groupe_applicable,
        STRING_TO_ARRAY("porteur_ids_noDAC", ' | ') AS ministeres_ids,
        STRING_TO_ARRAY(
            "porteur_shorts_noDAC", ' | '
        ) AS ministeres_polygrammes,
        STRING_TO_ARRAY(
            "porteur_shorts_DAC", ' | '
        ) AS directeurs_administration_centrale_polygrammes,
        STRING_TO_ARRAY(
            "porteur_ids_DAC", ' | '
        ) AS directeurs_administration_centrale_ids,
        STRING_TO_ARRAY(ch_per, ' | ') AS perimetre_ids,
        STRING_TO_ARRAY(ch_dp, ' | ') AS directeurs_projet_noms,
        STRING_TO_ARRAY(ch_dp_mail, ' | ') AS directeurs_projet_mails,
        -- Maille applicable déclarée
        STRING_TO_ARRAY(maille_applicable, ' | ') AS maille_applicable_declaree,
        UPPER(replicate_val_reg_to) AS replicate_val_reg_to,
        UPPER(replicate_val_nat_to) AS replicate_val_nat_to,
        ch_cible_attendue::BOOLEAN AS ch_cible_attendue,
        CASE
            WHEN ch_territo AND maille_applicable = 'REG | NAT' THEN 'REG'
            WHEN ch_territo AND maille_applicable IS NULL THEN 'DEPT'
            ELSE 'NAT'
        END AS maille_pilotage,
        conseiller_mail
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
            

            -- [disabled] NAT -> DEPT
            

            ELSE maille_applicable_declaree
        END AS maille_applicable
    FROM renamed

)

SELECT * FROM get_maille_applicable