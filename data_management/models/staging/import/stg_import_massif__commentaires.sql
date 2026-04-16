{{ config(materialized="view") }}

WITH

source AS (

    SELECT * FROM {{ ref('commentaires') }}

),

renamed AS (

    SELECT
        chantier_id,
        "type",
        contenu,
        TO_DATE("date", 'DD/MM/YYYY') AS "date",
        NULL::TEXT AS auteur,
        auteur_email,
        maille,
        code_insee::VARCHAR AS code_insee,
        TO_DATE(date_meteo, 'DD/MM/YYYY') AS date_meteo,
        meteo
    FROM source

)

SELECT * FROM renamed
