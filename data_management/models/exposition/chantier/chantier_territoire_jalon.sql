-- depends_on: {{ ref('chantier_territoire') }}

{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code', 'jalon'])
}}

WITH
tous_jalons AS (
    SELECT
        chantier_id,
        zone_id,
        taa_courant_ch AS taux_avancement_annuel,
        jalon
    FROM {{ ref('compute_ta_ch_jalon') }}
)

SELECT
    meta_ch.id,
    t.code AS territoire_code,
    t.maille,
    t.zone_id,
    t.code_insee,
    jalons_a_considerer.jalon,
    tous_jalons.taux_avancement_annuel AS taux_avancement
FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS t
CROSS JOIN {{ ref('jalons_a_etudier') }} AS jalons_a_considerer
LEFT JOIN
    tous_jalons
    ON
        t.zone_id = tous_jalons.zone_id
        AND meta_ch.id = tous_jalons.chantier_id
        AND jalons_a_considerer.jalon = tous_jalons.jalon
