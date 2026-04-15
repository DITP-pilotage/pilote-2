-- depends_on: {{ ref('chantier_identite') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id'],
        incremental_strategy='merge'
    )
}}

WITH mailles_applicables AS (
    SELECT
        id AS indic_id,
        ARRAY_AGG(LOWER(maille)::MAILLE) AS mailles_applicables
    FROM {{ ref('int_indicateurs_mailles_applicables') }}
    WHERE maille_est_applicable
    GROUP BY id
)

SELECT
    meta_indic.id,
    meta_indic.nom,
    meta_indic.chantier_id,
    meta_indic.indicateur_type_id AS type_id,
    meta_indic_types.nom AS type_nom,
    meta_indic.est_barometre,
    meta_indic.est_phare,
    meta_indic.description,
    meta_indic.source,
    meta_indic.mode_de_calcul,
    FALSE AS a_supprimer,
    meta_indic.unite AS unite_mesure,
    meta_indic.indicateur_parent_id AS parent_id,
    -- WARN: ce n'est pas EXACTEMENT le delai dispo de la table indic car depend de la maille
    complementaires.delai_disponibilite,
    complementaires.periodicite,
    STRING_TO_ARRAY(REPLACE(complementaires.resp_donnees_email, ' ', ''), ',')
        AS responsables_donnees_mails,
    mailles_applicables.mailles_applicables,
    meta_parametrage_indicateurs.va_nat_from IN ('REG', 'DEPT')
        AS maille_nat_agregee,
    meta_parametrage_indicateurs.va_reg_from IN ('DEPT') AS maille_reg_agregee,
    CASE
        WHEN
            meta_chantier.statut = 'SUPPRIME'
            OR meta_indic.est_cache_dans_pilote
            THEN 'SUPPRIME'::TYPE_STATUT_INDICATEUR
        ELSE 'PUBLIE'::TYPE_STATUT_INDICATEUR
    END AS statut
FROM {{ ref('stg_ppg_metadata__indicateurs') }} AS meta_indic
LEFT JOIN
    {{ ref('stg_ppg_metadata__parametrage_indicateurs') }}
        AS meta_parametrage_indicateurs
    ON meta_indic.id = meta_parametrage_indicateurs.indicateur_id
LEFT JOIN
    {{ source('parametrage_indicateurs', 'metadata_indicateurs_complementaire') }}
        AS complementaires
    ON meta_indic.id = complementaires.indic_id
LEFT JOIN
    {{ ref('stg_ppg_metadata__indicateur_types') }} AS meta_indic_types
    ON meta_indic.indicateur_type_id = meta_indic_types.id
LEFT JOIN mailles_applicables ON meta_indic.id = mailles_applicables.indic_id
LEFT JOIN
    {{ ref('stg_ppg_metadata__chantiers') }} AS meta_chantier
    ON meta_indic.chantier_id = meta_chantier.id
ORDER BY meta_indic.id
