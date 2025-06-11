-- depends_on: {{ ref('chantier_identite') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id'],
        incremental_strategy='merge'
    )
}}

WITH mailles_applicables AS (
    SELECT 
        id as indic_id, 
        ARRAY_AGG(LOWER(maille)::maille) AS mailles_applicables
    FROM {{ ref('int_indicateurs_mailles_applicables') }}
    WHERE maille_est_applicable
    GROUP BY id
)

SELECT 
    meta_indic.id AS id,
    meta_indic.nom,
    meta_indic.chantier_id,
    meta_indic.indicateur_type_id AS type_id,
    meta_indic_types.nom AS type_nom,
    meta_indic.est_barometre AS est_barometre,
    meta_indic.est_phare AS est_phare,
    meta_indic.description AS "description",
    meta_indic.source AS source,
    meta_indic.mode_de_calcul AS mode_de_calcul,
    FALSE AS a_supprimer,
    meta_indic.unite AS unite_mesure,
    meta_indic.indicateur_parent_id AS parent_id,
    -- WARN: ce n'est pas EXACTEMENT le delai dispo de la table indic car depend de la maille
    complementaires.delai_disponibilite,
    complementaires.periodicite,
    STRING_TO_ARRAY(REPLACE(complementaires.resp_donnees_email, ' ', ''), ',') AS responsables_donnees_mails,
    last_update_indic.dernier_import_date_indic AS dernier_import_date_indic,
    mailles_applicables.mailles_applicables,
    meta_parametrage_indicateurs.va_nat_from IN ('REG', 'DEPT') as maille_nat_agregee,
    meta_parametrage_indicateurs.va_reg_from IN ('DEPT') as maille_reg_agregee
FROM {{ ref('stg_ppg_metadata__indicateurs') }} meta_indic
LEFT JOIN {{ ref('stg_ppg_metadata__parametrage_indicateurs') }} meta_parametrage_indicateurs ON meta_indic.id = meta_parametrage_indicateurs.indicateur_id
LEFT JOIN {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }} AS complementaires ON meta_indic.id=complementaires.indic_id
LEFT JOIN {{ ref('stg_ppg_metadata__indicateur_types') }} meta_indic_types ON meta_indic_types.id = meta_indic.indicateur_type_id 
LEFT JOIN {{ ref('last_update_indic') }} last_update_indic ON meta_indic.id = last_update_indic.indic_id
LEFT JOIN mailles_applicables ON mailles_applicables.indic_id = meta_indic.id
ORDER BY meta_indic.id
