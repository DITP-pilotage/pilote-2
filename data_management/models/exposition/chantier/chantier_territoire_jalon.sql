-- depends_on: {{ ref('chantier_territoire') }}

{{ config(
        materialized = 'incremental', 
        unique_key = ['id', 'territoire_code', 'jalon'],
        incremental_strategy='merge'
    )
}}

WITH
tous_jalons AS (
    SELECT
        chantier_id,
        zone_id,
        taa_courant_ch AS taux_avancement_annuel,
        date_ta AS date_taux_avancement_annuel,
        jalon,
        taa_courant_eval_ch AS taux_avancement_annuel_eval
    FROM {{ ref('compute_ta_ch_jalon') }}
),

mediane_par_chantier_jalon AS (
    SELECT
        ta_ch_jalon.chantier_id,
        zones.zone_type AS maille,
        ta_ch_jalon.jalon,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ta_ch_jalon.taa_courant_ch)
            AS mediane
    FROM {{ ref('compute_ta_ch_jalon') }} AS ta_ch_jalon
    LEFT JOIN
        {{ source('python_load', 'metadata_zones') }} AS zones
        ON ta_ch_jalon.zone_id = zones.zone_id
    WHERE ta_ch_jalon.taa_courant_ch IS NOT NULL AND zones.zone_type <> 'NAT'
    GROUP BY ta_ch_jalon.chantier_id, zones.zone_type, ta_ch_jalon.jalon
)

SELECT
    meta_ch.id,
    territoire.code AS territoire_code,
    territoire.maille,
    territoire.zone_id,
    territoire.code_insee,
    jalons_a_considerer.jalon,
    tous_jalons.taux_avancement_annuel AS taux_avancement,
    tous_jalons.date_taux_avancement_annuel::DATE AS date_taux_avancement,
    tous_jalons.taux_avancement_annuel_eval AS taux_avancement_eval,
    ROUND(
        (
            tous_jalons.taux_avancement_annuel::NUMERIC
            - mediane_par_chantier_jalon.mediane::NUMERIC
        )::NUMERIC,
        1
    ) AS ecart
FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS territoire
CROSS JOIN {{ ref('jalons_a_etudier') }} AS jalons_a_considerer
LEFT JOIN
    tous_jalons
    ON
        territoire.zone_id = tous_jalons.zone_id
        AND meta_ch.id = tous_jalons.chantier_id
        AND jalons_a_considerer.jalon = tous_jalons.jalon
LEFT JOIN
    mediane_par_chantier_jalon
    ON
        meta_ch.id = mediane_par_chantier_jalon.chantier_id
        AND UPPER(territoire.maille::TEXT) = mediane_par_chantier_jalon.maille
        AND jalons_a_considerer.jalon = mediane_par_chantier_jalon.jalon
