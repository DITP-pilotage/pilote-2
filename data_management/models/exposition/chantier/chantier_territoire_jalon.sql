-- depends_on: {{ ref('chantier_territoire') }}

{{ config(
    materialized = 'incremental', 
    unique_key = ['id', 'territoire_code', 'jalon'])
}}

WITH
jalon_annee_precedente AS (
    SELECT
        chantier_id,
        t.zone_id,
        taa_prev_year AS taux_avancement_annuel,
        date_part('year', now()) - 1 AS jalon
    FROM {{ ref('get_ta_ch_prev_year') }} AS a
    LEFT JOIN {{ source('db_schema_public', 'territoire') }} AS t
        ON a.territoire_code = t.code
),

jalon_annee_courante AS (
    SELECT
        chantier_id,
        zone_id,
        taa_courant_ch AS taux_avancement_annuel,
        date_part('year', now()) AS jalon
    FROM {{ ref('compute_ta_ch') }}
    WHERE valid_on = 'today'
),

-- Tous les TA pour tous les jalons
jalon_annee_precedente_et_courante AS (
    SELECT * FROM jalon_annee_precedente
    UNION
    SELECT * FROM jalon_annee_courante
),

-- Les jalons à considerer: ici année en cours et année précédente.
jalons_a_considerer AS (
    SELECT (date_part('year', now())) AS jalon
    UNION
    SELECT (date_part('year', now()) - 1) AS jalon
)

SELECT
    meta_ch.id,
    t.code AS territoire_code,
    t.maille AS maille,
    z.zone_id AS zone_id,
    t.code_insee,
    jalons_a_considerer.jalon,
    tous_jalons.taux_avancement_annuel as taux_avancement
FROM {{ ref('stg_ppg_metadata__chantiers') }} AS meta_ch
CROSS JOIN {{ source('db_schema_public', 'territoire') }} AS t
LEFT JOIN
    {{ source('python_load', 'metadata_zones') }} AS z
    ON t.zone_id = z.zone_id
CROSS JOIN jalons_a_considerer
LEFT JOIN
    jalon_annee_precedente_et_courante AS tous_jalons
    ON t.zone_id = tous_jalons.zone_id AND meta_ch.id = tous_jalons.chantier_id AND jalons_a_considerer.jalon=tous_jalons.jalon
