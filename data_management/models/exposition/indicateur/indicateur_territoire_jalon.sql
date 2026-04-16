-- depends_on: {{ ref('indicateur_territoire') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id', 'territoire_code', 'jalon'],
        incremental_strategy='merge'
    )
}}

SELECT
    tous_jalons.indic_id AS id,
    territoire.code AS territoire_code,
    territoire.code_insee,
    territoire.maille,
    jalons.jalon,
    territoire.zone_id,
    tous_jalons.vca_date AS date_valeur_cible,
    tous_jalons.taa AS taux_avancement,
    tous_jalons.vca AS valeur_cible,
    tous_jalons.taa_proposition AS taux_avancement_proposition,
    tous_jalons.date_vaca AS date_valeur_actuelle,
    tous_jalons.vaca AS valeur_actuelle
FROM {{ ref('jalons_a_etudier') }} AS jalons
LEFT OUTER JOIN {{ ref('compute_ta_indic_jalon') }} AS tous_jalons
    ON jalons.jalon = tous_jalons.jalon
INNER JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
    ON tous_jalons.zone_id = territoire.zone_id
